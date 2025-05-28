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
import { ReactNode, useState } from "react";
import { useRequestPopup } from "../request-popup";
import { Input } from "@/components/ui/input";

export interface AppDeployParams {
  session?: Session;
  template: {
    containerId: string;
    flake: string;
    network?: string;
  };
  children: ReactNode;
}

export function AppDeploy(params: AppDeployParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>{params.children}</DialogTrigger>
      <DialogContent className="flex flex-col sm:max-w-7xl">
        <AppDeployInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

export function AppDeployInner({ session, template }: AppDeployParams) {
  const queryClient = useQueryClient();
  const setRequestPopup = useRequestPopup();

  const [containerIdEdit, setContainerIdEdit] = useState<string>(
    template.containerId
  );
  const [networkEdit, setNetworkEdit] = useState<string>(
    template.network ?? "host"
  );
  const [flakeEdit, setFlakeEdit] = useState<string>(template.flake);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Deploy new app</DialogTitle>
        <DialogDescription>Customize new app configuration</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Item title="App Name">
          <Input
            value={containerIdEdit}
            onChange={(e) => setContainerIdEdit(e.target.value)}
          />
        </Item>
        <Item title="Network">
          <Select value={networkEdit} onValueChange={(v) => setNetworkEdit(v)}>
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
      <DialogFooter>
        <Button
          onClick={() => {
            setContainerIdEdit(template.containerId);
            setFlakeEdit(template.flake);
            setNetworkEdit(template.network ?? "host");
          }}
          disabled={
            containerIdEdit === template.containerId &&
            flakeEdit === template.flake &&
            networkEdit === (template.network ?? "host")
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
                        container: containerIdEdit,
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
                        queryKey: [
                          "container",
                          containerIdEdit,
                          session.baseUrl,
                        ],
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
