"use client";

import { Card, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { Title } from "../../text";
import { AppEdit } from "./edit";
import { AppDelete } from "./delete";
import { AppUpdate } from "./update";
import { xnode } from "@openmesh-network/xnode-manager-sdk";
import { Processes } from "../common/processes";
import { FileExplorer } from "../common/file-explorer";

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
        <div className="flex gap-2 flex-wrap">
          <Processes session={session} scope={`container:${container}`} />
          <FileExplorer session={session} scope={`container:${container}`} />
          <AppEdit session={session} container={container} />
          <AppUpdate session={session} container={container} />
          <AppDelete session={session} container={container} />
        </div>
      </CardFooter>
    </Card>
  );
}
