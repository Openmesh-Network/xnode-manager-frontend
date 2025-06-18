"use client";

import { OSEdit } from "./edit";
import { OSUpdate } from "./update";
import { OSExpose } from "./expose";
import { xnode } from "@openmesh-network/xnode-manager-sdk";
import { Button } from "@/components/ui/button";
import { Processes } from "../common/processes";
import { FileExplorer } from "../common/file-explorer";
import { useOsReboot } from "@openmesh-network/xnode-manager-sdk-react";
import { useRequestPopup } from "../request-popup";

export function OS({ session }: { session?: xnode.utils.Session }) {
  const setRequestPopup = useRequestPopup();
  const { mutate: reboot } = useOsReboot({
    overrides: {
      onSuccess({ request_id }) {
        setRequestPopup({ request_id });
      },
    },
  });

  return (
    <div className="flex gap-2">
      <Processes session={session} scope="host" />
      <FileExplorer session={session} scope="host" />
      <OSEdit session={session} />
      <OSExpose session={session} />
      <OSUpdate session={session} />
      {session && <Button onClick={() => reboot({ session })}>Reboot</Button>}
    </div>
  );
}
