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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { changeConfig, Session } from "@/lib/xnode";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { useRequestPopup } from "../request-popup";
import { useContainerConfig } from "@/hooks/useXnode";

export interface AppEditParams {
  session?: Session;
  containerId: string;
}

export function AppEdit(params: AppEditParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col sm:max-w-7xl">
        <AppEditInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

export function AppEditInner({ session, containerId }: AppEditParams) {
  const queryClient = useQueryClient();
  const setRequestPopup = useRequestPopup();

  const { data: config } = useContainerConfig({
    session,
    containerId,
  });

  const [networkEdit, setNetworkEdit] = useState<string>("");
  const [flakeEdit, setFlakeEdit] = useState<string>("");

  useEffect(() => {
    if (!config) {
      return;
    }

    setNetworkEdit(config.network ?? "host");
    setFlakeEdit(config.flake);
  }, [config]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit {containerId}</DialogTitle>
        <DialogDescription>Edit app configuration</DialogDescription>
      </DialogHeader>
      {config && (
        <div className="flex flex-col gap-2">
          <Item title="Network">
            <Select
              value={networkEdit}
              onValueChange={(v) => setNetworkEdit(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="host">host</SelectItem>
                <SelectItem value="containernet">containernet</SelectItem>
              </SelectContent>
            </Select>
          </Item>
          <Item title="Flake">
            <Textarea
              className="max-h-96"
              value={flakeEdit}
              onChange={(e) => setFlakeEdit(e.target.value)}
            />
          </Item>
        </div>
      )}
      {config && (
        <DialogFooter>
          <Button
            onClick={() => {
              setFlakeEdit(config.flake);
              setNetworkEdit(config.network ?? "host");
            }}
            disabled={
              flakeEdit === config.flake &&
              networkEdit === (config.network ?? "host")
            }
          >
            Reset
          </Button>
          {session && (
            <DialogClose asChild>
              <Button
                onClick={() => {
                  changeConfig({
                    session,
                    changes: [
                      {
                        Set: {
                          container: containerId,
                          settings: {
                            flake: flakeEdit,
                            network: networkEdit === "host" ? "" : networkEdit,
                          },
                        },
                      },
                    ],
                  }).then((res) =>
                    setRequestPopup({
                      ...res,
                      onFinish: () => {
                        queryClient.invalidateQueries({
                          queryKey: ["container", containerId, session.baseUrl],
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
