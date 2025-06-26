"use client";

import { useSettings } from "../context/settings";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { UsageChart, UsageHistory } from "../charts/usage-chart";
import { Section, Title } from "../text";
import { Bar } from "../charts/bar";
import { App } from "./app";
import { AppStore } from "./app/store";
import { RequestPopupProvider } from "./request-popup";
import { OS } from "./os";
import {
  useAuthLogin,
  useConfigContainers,
  useUsageCpu,
  useUsageDisk,
  useUsageMemory,
} from "@openmesh-network/xnode-manager-sdk-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBaseUrl } from "@/lib/xnode";

export function XnodeDetailed() {
  const searchParams = useSearchParams();
  const baseUrl = useMemo(() => searchParams.get("baseUrl"), [searchParams]);

  const settings = useSettings();
  const xnode = useMemo(
    () => settings.xnodes.find((x) => getBaseUrl({ xnode: x }) === baseUrl),
    [settings.xnodes, baseUrl]
  );

  const { replace } = useRouter();
  useEffect(() => {
    if (settings && !xnode) {
      // Xnode not in import list, redirect to home page
      replace("/");
    }
  }, [settings, xnode]);

  const { data: session } = useAuthLogin({
    baseUrl: getBaseUrl({ xnode }),
    ...xnode?.loginArgs,
  });

  const { data: cpu, dataUpdatedAt: cpuUpdatedAt } = useUsageCpu({
    session,
    scope: "host",
  });
  const { data: memory, dataUpdatedAt: memoryUpdatedAt } = useUsageMemory({
    session,
    scope: "host",
  });
  const { data: disk } = useUsageDisk({ session, scope: "host" });

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

  const { data: apps } = useConfigContainers({
    session: session,
  });

  return (
    <RequestPopupProvider session={session}>
      <div className="flex flex-col gap-5">
        <Section title={`Monitor Xnode ${xnode?.secure ?? xnode?.insecure}`}>
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
            <div className="@container">
              <div className="grid gap-3 grid-cols-3 @max-lg:grid-cols-1 @max-3xl:grid-cols-2">
                {apps.map((app) => (
                  <App key={app} session={session} container={app} />
                ))}
              </div>
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
