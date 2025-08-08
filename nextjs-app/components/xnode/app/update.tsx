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
import { FileUpdatable, NixLock, NixUpdatable } from "../common/update";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import appstore from "@/public/appstore.json";
import { useKeepUserConfig } from "@/hooks/useUserConfig";

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

  const [updateConfig, setUpdateConfig] = useState<boolean>(false);
  const updatedConfig = useMemo(
    () => appstore.find((app) => app.name === container)?.flake,
    [appstore, container]
  );
  const latestConfig = useKeepUserConfig({
    config: config?.flake,
    updatedConfig,
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Update {container}</DialogTitle>
        <DialogDescription>
          Inspect and update all app dependencies
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        {config && (
          <FileUpdatable
            session={session}
            current={config.flake}
            latest={latestConfig}
            selected={updateConfig}
            setSelected={(s) => setUpdateConfig(s)}
          />
        )}
        {lock &&
          inputs.map((i) => (
            <NixUpdatable
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
          onClick={() => {
            setUpdateInputs([]);
            setUpdateConfig(false);
          }}
          disabled={updateInputs.length === 0 && !updateConfig}
        >
          Clear Selection
        </Button>
        <Button
          onClick={() => {
            setUpdateInputs(inputs);
            setUpdateConfig(true);
          }}
          disabled={inputs.length === updateInputs.length && updateConfig}
        >
          Select All
        </Button>
        {session && config && (
          <DialogClose asChild>
            <Button
              onClick={() => {
                let flake: string;
                if (updateConfig) {
                  if (latestConfig !== undefined) {
                    flake = latestConfig;
                  } else {
                    return;
                  }
                } else {
                  flake = config.flake;
                }
                set({
                  session,
                  path: { container },
                  data: {
                    settings: {
                      flake,
                      network: config.network,
                    },
                    update_inputs: updateInputs,
                  },
                });
              }}
              disabled={updateInputs.length === 0 && !updateConfig}
            >
              Update
            </Button>
          </DialogClose>
        )}
      </DialogFooter>
    </>
  );
}
