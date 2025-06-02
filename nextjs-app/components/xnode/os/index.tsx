"use client";

import { OSEdit } from "./edit";
import { OSUpdate } from "./update";
import { OSExpose } from "./expose";
import { xnode } from "@openmesh-network/xnode-manager-sdk";

export function OS({ session }: { session?: xnode.utils.Session }) {
  return (
    <div className="flex gap-2">
      <OSEdit session={session} />
      <OSExpose session={session} />
      <OSUpdate session={session} />
    </div>
  );
}
