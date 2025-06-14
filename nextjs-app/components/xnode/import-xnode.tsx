"use client";

import { useSetSettings, useSettings, Xnode } from "../context/settings";
import { useAddress } from "@/hooks/useAddress";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { xnode } from "@openmesh-network/xnode-manager-sdk";
import { getBaseUrl } from "@/lib/xnode";

export function ImportXnode() {
  const address = useAddress();
  const settings = useSettings();
  const setSettings = useSetSettings();

  const [domain, setDomain] = useState<string>("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={!address}>Import</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Xnode</DialogTitle>
          <DialogDescription>
            In case you have deployed an Xnode before and wish to manage it
            through this interface. The connected wallet should be the owner of
            the imported Xnode.
          </DialogDescription>
          <div className="flex flex-col gap-1">
            <Label htmlFor="xnode-domain">Xnode Domain</Label>
            <Input
              id="xnode-domain"
              placeholder="xnode.example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              onClick={() => {
                setDomain("");
              }}
            >
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={() => {
                if (!address) {
                  return;
                }

                if (
                  settings.xnodes.some(
                    (x) => x.secure === domain || x.insecure === domain
                  )
                ) {
                  // Xnode already imported
                  return;
                }

                // If domain is ip address, use insecure
                const insecure = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
                const importedXnode = {
                  owner: address,
                  secure: !insecure ? domain : undefined,
                  insecure: insecure ? domain : undefined,
                } satisfies Xnode;

                const baseUrl = getBaseUrl({ xnode: importedXnode }); // HTTP requests require a forward proxy
                if (!baseUrl) {
                  throw new Error(
                    `Base url for Xnode ${importedXnode} could not be calculated.`
                  );
                }

                xnode.auth
                  .login({ baseUrl, sig: settings.wallets[address] })
                  .then((session) => xnode.auth.scopes({ session }))
                  .then((scopes) => {
                    if (scopes.length > 0) {
                      setSettings({
                        ...settings,
                        xnodes: settings.xnodes.concat([importedXnode]),
                      });
                      setDomain("");
                    } else {
                      console.error(
                        `${address} does not have any permissions on Xnode ${domain}`
                      );
                    }
                  });
              }}
            >
              Import
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
