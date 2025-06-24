"use client";

import { useMemo } from "react";
import { useSettings } from "../context/settings";
import { useAddress } from "@/hooks/useAddress";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { XnodeSummary } from "./xnode-summary";
import Link from "next/link";
import { getBaseUrl } from "@/lib/xnode";

export function MyXnodes() {
  const address = useAddress();
  const { xnodes } = useSettings();

  const myXnodes = useMemo(() => {
    if (!address) {
      return [];
    } else return xnodes.filter((x) => x.owner === address);
  }, [address, xnodes]);

  return (
    <div className="@container">
      {myXnodes.length > 0 ? (
        <div className="grid gap-3 grid-cols-4 @max-lg:grid-cols-1 @max-3xl:grid-cols-2 @max-6xl:grid-cols-3">
          {myXnodes.map((xnode, i) => (
            <Link key={i} href={`/xnode?baseUrl=${getBaseUrl({ xnode })}`}>
              <XnodeSummary xnode={xnode} />
            </Link>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertTitle>No Xnodes found.</AlertTitle>
          <AlertDescription>
            Your Xnodes are saved in your browser cache. In case you are
            accessing from a different browser or device, please import your
            Xnodes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
