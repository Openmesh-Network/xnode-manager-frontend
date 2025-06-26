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
import { useMemo, useState } from "react";
import { useRequestPopup } from "../request-popup";
import { xnode } from "@openmesh-network/xnode-manager-sdk";
import {
  useConfigContainerGet,
  useConfigContainerSet,
} from "@openmesh-network/xnode-manager-sdk-react";
import { NixLock, Updatable } from "../common/update";

export interface AppUpdateParams {
  session?: xnode.utils.Session;
  container: string;
}

export function AppUpdate(params: AppUpdateParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Update</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col">
        <AppUpdateInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

function AppUpdateInner({ session, container }: AppUpdateParams) {
  const setRequestPopup = useRequestPopup();
  const { mutate: set } = useConfigContainerSet({
    overrides: {
      onSuccess({ request_id }) {
        setRequestPopup({ request_id });
      },
    },
  });

  const { data: config } = useConfigContainerGet({
    session,
    container,
  });

  const [updateInputs, setUpdateInputs] = useState<string[]>([]);
  const lock = useMemo(() => {
    if (!config || !config.flake_lock) {
      return undefined;
    }

    return JSON.parse(config.flake_lock) as NixLock;
  }, [config]);
  const inputs = useMemo(() => {
    if (!lock) {
      return [];
    }

    const allInputs = lock.nodes[lock.root].inputs;
    if (!allInputs) {
      return [];
    }

    return Object.keys(allInputs).filter(
      (i) => typeof allInputs[i] === "string"
    ); // Only return inputs that can be updated (not following other inputs)
  }, [lock]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Update {container}</DialogTitle>
        <DialogDescription>
          Inspect and update all app dependencies
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        {session &&
          lock &&
          inputs.map((i) => (
            <Updatable
              key={i}
              session={session}
              lock={lock}
              input={i}
              selected={updateInputs.includes(i)}
              setSelected={(s) => {
                if (s) {
                  setUpdateInputs((inputs) => inputs.concat([i]));
                } else {
                  setUpdateInputs((inputs) => inputs.filter((i2) => i2 !== i));
                }
              }}
            />
          ))}
      </div>
      <DialogFooter>
        <Button
          onClick={() => setUpdateInputs([])}
          disabled={updateInputs.length === 0}
        >
          Clear Selection
        </Button>
        <Button
          onClick={() => setUpdateInputs(inputs)}
          disabled={inputs.length === updateInputs.length}
        >
          Select All
        </Button>
        {session && config && (
          <DialogClose asChild>
            <Button
              onClick={() => {
                set({
                  session,
                  path: { container },
                  data: {
                    settings: {
                      flake: config.flake,
                      network: config.network,
                    },
                    update_inputs: updateInputs,
                  },
                });
              }}
              disabled={updateInputs.length === 0}
            >
              Update
            </Button>
          </DialogClose>
        )}
      </DialogFooter>
    </>
  );
}
