"use client";

import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { changeConfig, Session } from "@/lib/xnode";
import { Trash2 } from "lucide-react";
import { useRequestPopup } from "../request-popup";
import { useQueryClient } from "@tanstack/react-query";

export interface AppDeleteParams {
  session?: Session;
  containerId: string;
}

export function AppDelete(params: AppDeleteParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <Trash2 className="text-red-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col">
        <AppDeleteInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

export function AppDeleteInner({ session, containerId }: AppDeleteParams) {
  const queryClient = useQueryClient();
  const setRequestPopup = useRequestPopup();

  return (
    <>
      <DialogHeader>
        <DialogTitle>Delete {containerId}</DialogTitle>
        <DialogDescription>
          This will permanently remove this app and all it's data. This action
          cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        {session && (
          <DialogClose asChild>
            <Button
              variant="destructive"
              onClick={() => {
                changeConfig({
                  session,
                  changes: [
                    {
                      Remove: {
                        container: containerId,
                        backup: false,
                      },
                    },
                  ],
                }).then((res) =>
                  setRequestPopup({
                    ...res,
                    onFinish: () => {
                      queryClient.invalidateQueries({
                        queryKey: ["containers", session.baseUrl],
                      });
                    },
                  })
                );
              }}
            >
              Delete
            </Button>
          </DialogClose>
        )}
      </DialogFooter>
    </>
  );
}
