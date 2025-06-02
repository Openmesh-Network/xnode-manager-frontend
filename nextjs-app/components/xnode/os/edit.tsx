"use client";

import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { useRequestPopup } from "../request-popup";
import { useOS } from "@/hooks/useXnode";
import { Input } from "@/components/ui/input";
import { NixEditor } from "@/components/ui/nix-editor";
import { xnode } from "@openmesh-network/xnode-manager-sdk";

export interface OSEditParams {
  session?: xnode.utils.Session;
}

export function OSEdit(params: OSEditParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col sm:max-w-7xl">
        <OSEditInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

export function OSEditInner({ session }: OSEditParams) {
  const queryClient = useQueryClient();
  const setRequestPopup = useRequestPopup();

  const { data: config } = useOS({
    session,
  });

  const [flakeEdit, setFlakeEdit] = useState<string>("");
  const [xnodeOwnerEdit, setXnodeOwnerEdit] = useState<string>("");
  const [domainEdit, setDomainEdit] = useState<string>("");
  const [acmeEmailEdit, setAcmeEmailEdit] = useState<string>("");

  useEffect(() => {
    if (!config) {
      return;
    }

    setFlakeEdit(config.flake);
    setXnodeOwnerEdit(config.xnode_owner ?? "");
    setDomainEdit(config.domain ?? "");
    setAcmeEmailEdit(config.acme_email ?? "");
  }, [config]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit OS</DialogTitle>
        <DialogDescription>
          Edit operating system configuration
        </DialogDescription>
      </DialogHeader>
      {config && (
        <div className="flex flex-col gap-2">
          <Item title="Owner">
            <Input
              value={xnodeOwnerEdit}
              onChange={(e) => setXnodeOwnerEdit(e.target.value)}
            />
          </Item>
          <Item title="Domain">
            <Input
              value={domainEdit}
              onChange={(e) => setDomainEdit(e.target.value)}
            />
          </Item>
          <Item title="ACME Email">
            <Input
              value={acmeEmailEdit}
              onChange={(e) => setAcmeEmailEdit(e.target.value)}
            />
          </Item>
          <NixEditor title="Flake" value={flakeEdit} onChange={setFlakeEdit} />
        </div>
      )}
      {config && (
        <DialogFooter>
          <Button
            onClick={() => {
              setFlakeEdit(config.flake);
              setXnodeOwnerEdit(config.xnode_owner ?? "");
              setDomainEdit(config.domain ?? "");
              setAcmeEmailEdit(config.acme_email ?? "");
            }}
            disabled={
              flakeEdit === config.flake &&
              xnodeOwnerEdit === (config.xnode_owner ?? "") &&
              domainEdit === (config.domain ?? "") &&
              acmeEmailEdit === (config.acme_email ?? "")
            }
          >
            Reset
          </Button>
          {session && (
            <DialogClose asChild>
              <Button
                onClick={() => {
                  xnode.os
                    .set({
                      session,
                      os: {
                        flake: flakeEdit,
                        xnode_owner: xnodeOwnerEdit,
                        domain: domainEdit,
                        acme_email: acmeEmailEdit,
                        user_passwd: null,
                        update_inputs: null,
                      },
                    })
                    .then((res) =>
                      setRequestPopup({
                        ...res,
                        onFinish: () => {
                          queryClient.invalidateQueries({
                            queryKey: ["OS", session.baseUrl],
                          });
                        },
                      })
                    );
                }}
              >
                Apply
              </Button>
            </DialogClose>
          )}
        </DialogFooter>
      )}
    </>
  );
}

function Item({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{title}</Label>
      {children}
    </div>
  );
}
