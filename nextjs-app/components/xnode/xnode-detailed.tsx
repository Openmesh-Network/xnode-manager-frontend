"use client";

import { useSetSettings, useSettings } from "../context/settings";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AlertTriangle, Hourglass } from "lucide-react";
import {
  useContainers,
  useCpu,
  useDisk,
  useMemory,
  useSession,
} from "@/hooks/useXnode";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { UsageChart, UsageHistory } from "../charts/usage-chart";
import { Section, Title } from "../text";
import { Button } from "../ui/button";
import { Bar } from "../charts/bar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { setOS } from "@/lib/xnode";
import { App } from "./app";

export function XnodeDetailed({ domain }: { domain?: string }) {
  const settings = useSettings();
  const setSettings = useSetSettings();
  const xnode = useMemo(
    () => settings.xnodes.find((x) => x.domain === domain),
    [settings.xnodes]
  );

  const [busy, setBusy] = useState<boolean>(false);

  const [xnodeDomain, setXnodeDomain] = useState<string>("");
  const [acmeEmail, setAcmeEmail] = useState<string>("");
  const { push } = useRouter();

  const { data: session } = useSession({ xnode });
  const { data: cpu, dataUpdatedAt: cpuUpdatedAt } = useCpu({ session });
  const { data: memory, dataUpdatedAt: memoryUpdatedAt } = useMemory({
    session,
  });
  const { data: disk } = useDisk({ session });

  const [cpuHistory, setCpuHistory] = useState<UsageHistory[]>([]);
  useEffect(() => {
    if (!cpu) {
      return;
    }

    const avgUsage = cpu.reduce((prev, cur) => prev + cur.used, 0) / cpu.length;
    setCpuHistory([
      ...cpuHistory.slice(-99),
      { date: cpuUpdatedAt, usage: avgUsage },
    ]);
  }, [cpu, cpuUpdatedAt]);

  const [memoryHistory, setMemoryHistory] = useState<UsageHistory[]>([]);
  useEffect(() => {
    if (!memory) {
      return;
    }

    const usage = (100 * memory.used) / memory.total;
    setMemoryHistory([
      ...memoryHistory.slice(-99),
      { date: memoryUpdatedAt, usage },
    ]);
  }, [memory, memoryUpdatedAt]);

  const { data: apps } = useContainers({
    session: session,
  });

  return (
    <>
      <div className="flex flex-col gap-5">
        {xnode?.insecure && (
          <Alert>
            <AlertTriangle />
            <AlertTitle>WARNING: Using unencrypted communication!</AlertTitle>
            <AlertDescription>
              <span>
                You should enable HTTPS before accessing any confidential
                information on your Xnode (such as validator private keys).
                Setup an A record pointing to this Xnode IP address ({domain}),
                it can be under any (sub)domain. Only press the update button
                once the record has been set and has propagated, otherwise you
                might become locked out of your Xnode. Email is required and
                cannot be from a blacklisted domain (e.g. @example.com).
              </span>
              <div className="pt-1 flex gap-2 flex-wrap">
                <div className="flex gap-2">
                  <Label htmlFor="xnode-domain">Domain</Label>
                  <Input
                    id="xnode-domain"
                    className="min-w-40"
                    value={xnodeDomain}
                    onChange={(e) => setXnodeDomain(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Label htmlFor="xnode-domain">ACME Email</Label>
                  <Input
                    id="acme-email"
                    className="min-w-40"
                    value={acmeEmail}
                    onChange={(e) => setAcmeEmail(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => {
                    if (!session) {
                      return;
                    }

                    setBusy(true);
                    setOS({
                      session,
                      os: {
                        domain: xnodeDomain,
                        acme_email: acmeEmail,
                        as_child: false,
                      },
                    })
                      .then(() => {
                        setSettings({
                          ...settings,
                          xnodes: settings.xnodes.map((x) => {
                            if (x === xnode) {
                              return {
                                ...xnode,
                                domain: xnodeDomain,
                                insecure: false,
                              };
                            }

                            return x;
                          }),
                        });
                        push(`/xnode/${xnodeDomain}`);
                      })
                      .finally(() => setBusy(false));
                  }}
                  disabled={busy}
                >
                  Update
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        <Section title="Monitor Xnode">
          <div className="grid grid-cols-3 gap-2 max-lg:grid-cols-2 max-md:grid-cols-1">
            {cpuHistory.length > 0 && (
              <UsageChart title="CPU Usage" label="CPU" data={cpuHistory} />
            )}
            {memoryHistory.length > 0 && (
              <UsageChart
                title="Memory Usage"
                label="Memory"
                data={memoryHistory}
              />
            )}
            {disk && (
              <Card>
                <CardHeader>
                  <CardTitle>Disk Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  {disk.map((d, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-sm">
                        Disk {d.mount_point.replace("/mnt/disk", "")}
                      </span>
                      <Bar
                        used={d.used}
                        total={d.total}
                        label="GB"
                        divider={1024 * 1024 * 1024}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </Section>
        {apps && (
          <SectionCard title="Apps">
            {apps.map((app, i) => (
              <App key={i} session={session} containerId={app} />
            ))}
          </SectionCard>
        )}
      </div>
      <AlertDialog open={busy}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Performing action...</AlertDialogTitle>
            <AlertDialogDescription className="flex gap-1 place-items-center">
              <Hourglass />
              <span>Please wait. Do not refresh the page.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>
          <Title title={title} />
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full flex flex-col gap-2 place-content-between">
        <div /> {/* Force equal gap at the top */}
        {children}
      </CardContent>
    </Card>
  );
}
