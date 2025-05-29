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
import { AppStore } from "./app/store";
import { RequestPopupProvider } from "./request-popup";
import { OS } from "./os";

export function XnodeDetailed({ domain }: { domain?: string }) {
  const settings = useSettings();
  const setSettings = useSetSettings();
  const xnode = useMemo(
    () => settings.xnodes.find((x) => x.domain === domain),
    [settings.xnodes]
  );

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
    <RequestPopupProvider session={session}>
      <div className="flex flex-col gap-5">
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
                  {disk.map((d) => (
                    <div key={d.mount_point} className="flex flex-col">
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
        <SectionCard title="Host">
          <OS session={session} />
        </SectionCard>
        {apps && (
          <SectionCard title="Apps">
            <AppStore session={session} exclude={apps} />
            <div className="flex gap-3 flex-wrap">
              {apps.map((app) => (
                <App key={app} session={session} containerId={app} />
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </RequestPopupProvider>
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
