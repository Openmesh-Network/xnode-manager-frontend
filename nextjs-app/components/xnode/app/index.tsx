"use client";

import { Session } from "@/lib/xnode";
import { Card, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { Title } from "../../text";
import { AppEdit } from "./edit";
import { AppFileExplorer } from "./file-explorer";
import { AppLogs } from "./processes";
import { Button } from "@/components/ui/button";
import { AppDelete } from "./delete";
import { AppUpdate } from "./update";

export function App({
  session,
  containerId,
}: {
  session?: Session;
  containerId: string;
}) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle>
          <Title title={containerId} />
        </CardTitle>
      </CardHeader>
      <CardFooter>
        <div className="flex gap-2 flex-wrap max-w-80">
          <AppLogs session={session} containerId={containerId} />
          <AppFileExplorer session={session} containerId={containerId} />
          <AppEdit session={session} containerId={containerId} />
          <AppUpdate session={session} containerId={containerId} />
          <AppDelete session={session} containerId={containerId} />
        </div>
      </CardFooter>
    </Card>
  );
}
