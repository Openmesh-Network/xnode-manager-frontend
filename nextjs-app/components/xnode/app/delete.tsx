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
import { Trash2 } from "lucide-react";
import { useRequestPopup } from "../request-popup";
import { xnode } from "@openmesh-network/xnode-manager-sdk";
import { useConfigContainerRemove } from "@openmesh-network/xnode-manager-sdk-react";

export interface AppDeleteParams {
  session?: xnode.utils.Session;
  container: string;
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

function AppDeleteInner({ session, container }: AppDeleteParams) {
  const setRequestPopup = useRequestPopup();
  const { mutate: remove } = useConfigContainerRemove({
    overrides: {
      onSuccess({ request_id }) {
        setRequestPopup({ request_id });
      },
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Delete {container}</DialogTitle>
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
                remove({
                  session,
                  path: { container },
                });
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
