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
import { useOsGet, useOsSet } from "@openmesh-network/xnode-manager-sdk-react";
import { FileUpdatable, NixLock, NixUpdatable } from "../common/update";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useKeepUserConfig } from "@/hooks/useUserConfig";

export interface OSUpdateParams {
  session?: xnode.utils.Session;
}

export function OSUpdate(params: OSUpdateParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Update</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col">
        <OSUpdateInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

function OSUpdateInner({ session }: OSUpdateParams) {
  const setRequestPopup = useRequestPopup();
  const { mutate: set } = useOsSet({
    overrides: {
      onSuccess({ request_id }) {
        setRequestPopup({ request_id });
      },
    },
  });

  const { data: config } = useOsGet({
    session,
  });

  const [updateInputs, setUpdateInputs] = useState<string[]>([]);
  const lock = useMemo(() => {
    if (!config) {
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

    return Object.keys(allInputs)
      .map((input) => {
        return { name: input, value: allInputs[input] };
      })
      .filter((input) => typeof input.value === "string") as {
      name: string;
      value: string;
    }[]; // Only return inputs that can be updated (not following other inputs)
  }, [lock]);

  const [updateConfig, setUpdateConfig] = useState<boolean>(false);
  const url =
    "https://raw.githubusercontent.com/Openmesh-Network/xnode-manager/main/os/flake.nix";
  const { data: updatedConfig } = useQuery({
    queryKey: [url],
    queryFn: async () => {
      return await axios.get(url).then((res) => res.data as string);
    },
  });
  const latestConfig = useKeepUserConfig({
    config: config?.flake,
    updatedConfig,
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Update OS</DialogTitle>
        <DialogDescription>
          Inspect and update all operating system dependencies
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
              key={i.name}
              session={session}
              lock={lock}
              input={i}
              selected={updateInputs.includes(i.name)}
              setSelected={(s) => {
                if (s) {
                  setUpdateInputs((inputs) => inputs.concat([i.name]));
                } else {
                  setUpdateInputs((inputs) =>
                    inputs.filter((inputName) => inputName !== i.name)
                  );
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
            setUpdateInputs(inputs.map((input) => input.name));
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
                let flake: string | null;
                if (updateConfig) {
                  if (latestConfig !== undefined) {
                    flake = latestConfig;
                  } else {
                    return;
                  }
                } else {
                  flake = null;
                }

                set({
                  session,
                  data: {
                    flake,
                    xnode_owner: null,
                    domain: null,
                    acme_email: null,
                    user_passwd: null,
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
