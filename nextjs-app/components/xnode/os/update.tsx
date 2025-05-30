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
import { Session, setOS } from "@/lib/xnode";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useRequestPopup } from "../request-popup";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import { LatestVersionReturn } from "@/app/api/nix/latest-version/route";
import { Label } from "@/components/ui/label";
import { CheckCircle, Hourglass, TriangleAlert } from "lucide-react";
import { useOS } from "@/hooks/useXnode";

export interface NixLock {
  nodes: {
    [input: string]: {
      inputs?: { [input: string]: string | string[] };
      locked?: {
        lastModified: number;
        narHash: string;
        owner: string;
        repo: string;
        rev: string;
        type: string;
      };
      original?: {
        owner: string;
        repo: string;
        ref?: string;
        type: string;
      };
    };
  };
  root: string;
  version: number;
}

export interface OSUpdateParams {
  session?: Session;
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
  const queryClient = useQueryClient();
  const setRequestPopup = useRequestPopup();

  const { data: config } = useOS({
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

    return Object.keys(allInputs).filter(
      (i) => typeof allInputs[i] === "string"
    ); // Only return inputs that can be updated (not following other inputs)
  }, [lock]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Update OS</DialogTitle>
        <DialogDescription>
          Inspect and update all operating system dependencies
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        {lock &&
          inputs.map((i) => (
            <Updatable
              key={i}
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
                setOS({
                  session,
                  os: {
                    update_inputs: updateInputs,
                  },
                }).then((res) =>
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

function Updatable({
  lock,
  input,
  selected,
  setSelected,
}: {
  lock: NixLock;
  input: string;
  selected: boolean;
  setSelected: (selected: boolean) => void;
}) {
  const current = useMemo(() => lock.nodes[input], [lock.nodes, input]);
  const { data: latest } = useQuery({
    queryKey: [
      "branch",
      current.original?.type ?? "",
      current.original?.owner ?? "",
      current.original?.repo ?? "",
      current.original?.ref ?? "",
    ],
    enabled: !!current.original,
    queryFn: async () => {
      if (!current.original) {
        return undefined;
      }

      return (
        current.original.type === "github"
          ? await axios
              .get("/api/nix/latest-version", {
                params: {
                  flake: `${current.original.type}:${current.original.owner}/${
                    current.original.repo
                  }${current.original.ref ? `/${current.original.ref}` : ""}`,
                },
              })
              .then((res) => res.data as LatestVersionReturn)
              .then((data) => {
                return {
                  rev: data.revision,
                  time: data.lastModified,
                };
              })
          : {}
      ) as { rev?: string; time?: number; message?: string };
    },
    refetchInterval: 60 * 1000, // 1 minute
  });

  const updatable = useMemo(() => {
    if (!current.locked || !latest?.rev) {
      return undefined;
    }

    return current.locked.rev !== latest.rev;
  }, [current.locked, latest?.rev]);

  return (
    <div className="items-top flex space-x-2">
      <Checkbox
        id={`update-${input}`}
        checked={selected}
        onCheckedChange={(c) => {
          if (c !== "indeterminate") {
            setSelected(c);
          }
        }}
        disabled={updatable === false}
      />
      <div className="grid gap-1.5 leading-none">
        <Label
          htmlFor={`update-${input}`}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex gap-2"
        >
          <span>{input}</span>
          {updatable === undefined ? (
            <Hourglass className="size-4" />
          ) : updatable ? (
            <TriangleAlert className="size-4 text-red-600" />
          ) : (
            <CheckCircle className="size-4 text-green-600" />
          )}
        </Label>
        {current.original && (
          <span className="text-sm text-muted-foreground">
            Tracking {current.original.type}:{current.original.owner}/
            {current.original.repo}
            {current.original.ref ? `/${current.original.ref}` : ""}
          </span>
        )}
        {current.locked && (
          <span className="text-sm text-muted-foreground">
            Current version:{" "}
            {new Date(current.locked.lastModified * 1000).toLocaleString()}
          </span>
        )}
        {latest && (
          <span className="text-sm text-muted-foreground">
            Latest version:{" "}
            {latest.time
              ? new Date(latest.time * 1000).toLocaleString()
              : "unknown"}
            {latest.message ? ` (${latest.message})` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
