"use client";

import { Session } from "@/lib/xnode";
import { OSEdit } from "./edit";
import { OSUpdate } from "./update";

export function OS({ session }: { session?: Session }) {
  return (
    <div className="flex gap-2">
      <OSEdit session={session} />
      <OSUpdate session={session} />
    </div>
  );
}
