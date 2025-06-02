"use client";

import { Card, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { Title } from "../../text";
import { AppEdit } from "./edit";
import { AppFileExplorer } from "./file-explorer";
import { AppProcesses } from "./processes";
import { AppDelete } from "./delete";
import { AppUpdate } from "./update";
import { xnode } from "@openmesh-network/xnode-manager-sdk";

export function App({
  session,
  container,
}: {
  session?: xnode.utils.Session;
  container: string;
}) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle>
          <Title title={container} />
        </CardTitle>
      </CardHeader>
      <CardFooter>
        <div className="flex gap-2 flex-wrap max-w-80">
          <AppProcesses session={session} container={container} />
          <AppFileExplorer session={session} container={container} />
          <AppEdit session={session} container={container} />
          <AppUpdate session={session} container={container} />
          <AppDelete session={session} container={container} />
        </div>
      </CardFooter>
    </Card>
  );
}
