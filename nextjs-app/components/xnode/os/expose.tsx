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
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRequestPopup } from "../request-popup";
import { useContainers, useOS } from "@/hooks/useXnode";
import { Input } from "@/components/ui/input";
import { useUserConfig } from "@/hooks/useUserConfig";
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface OSExposeParams {
  session?: Session;
}

export function OSExpose(params: OSExposeParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Expose</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col sm:max-w-7xl">
        <OSExposeInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

export function OSExposeInner({ session }: OSExposeParams) {
  const queryClient = useQueryClient();
  const setRequestPopup = useRequestPopup();

  const { data: config } = useOS({
    session,
  });
  const userConfig = useUserConfig({ config: config?.flake });
  const exposed = useMemo(() => {
    if (!userConfig) {
      return undefined;
    }

    const domainRegex = new RegExp(
      /services.xnode-reverse-proxy.rules.(.*)=[^]]*\[((?:\n|.)*?)\];/g
    );
    const rulesRegex = new RegExp(/{((?:\n|.)*?)}/g);
    const entryRegex = new RegExp(/([^;]*)=((?:.)*?);/g);

    return userConfig
      .matchAll(domainRegex)
      .map((expose) => {
        const domain = expose.at(1)?.trim() ?? "UNKNOWN";
        const rules =
          expose
            .at(2)
            ?.matchAll(rulesRegex)
            .map(
              (rule) =>
                rule
                  .at(1)
                  ?.matchAll(entryRegex)
                  .map((entry) => {
                    const key = entry.at(1)?.trim() ?? "UNKNOWN";
                    const value = entry.at(2)?.trim() ?? "UNKNOWN";
                    return { key, value };
                  })
                  .toArray() ?? []
            )
            .toArray() ?? [];
        return { raw: expose.at(0), domain, rules };
      })
      .toArray();
  }, [userConfig]);

  const [exposedEdit, setExposedEdit] = useState<typeof exposed>([]);
  useEffect(() => {
    setExposedEdit(exposed);
  }, [exposed]);

  const editExpose = (
    original: { expose: NonNullable<typeof exposedEdit>[0] },
    edit: NonNullable<typeof exposedEdit>[0]
  ) => {
    setExposedEdit(exposedEdit?.map((e) => (e === original.expose ? edit : e)));
  };

  const addExpose = (add: NonNullable<typeof exposedEdit>[0]) => {
    setExposedEdit(exposedEdit?.concat([add]));
  };

  const removeExpose = (original: {
    expose: NonNullable<typeof exposedEdit>[0];
  }) => {
    setExposedEdit(exposedEdit?.filter((e) => e !== original.expose));
  };

  const editRule = (
    original: {
      expose: NonNullable<typeof exposedEdit>[0];
      rule: NonNullable<typeof exposedEdit>[0]["rules"][0];
    },
    edit: NonNullable<typeof exposedEdit>[0]["rules"][0]
  ) => {
    editExpose(original, {
      ...original.expose,
      rules: original.expose.rules.map((r) => (r === original.rule ? edit : r)),
    });
  };

  const addRule = (
    original: {
      expose: NonNullable<typeof exposedEdit>[0];
    },
    add: NonNullable<typeof exposedEdit>[0]["rules"][0]
  ) => {
    editExpose(original, {
      ...original.expose,
      rules: original.expose.rules.concat([add]),
    });
  };

  const removeRule = (original: {
    expose: NonNullable<typeof exposedEdit>[0];
    rule: NonNullable<typeof exposedEdit>[0]["rules"][0];
  }) => {
    editExpose(original, {
      ...original.expose,
      rules: original.expose.rules.filter((r) => r !== original.rule),
    });
  };

  const editEntry = (
    original: {
      expose: NonNullable<typeof exposedEdit>[0];
      rule: NonNullable<typeof exposedEdit>[0]["rules"][0];
      entry: NonNullable<typeof exposedEdit>[0]["rules"][0][0];
    },
    edit: NonNullable<typeof exposedEdit>[0]["rules"][0][0]
  ) => {
    editRule(
      original,
      original.rule.map((e) => (e === original.entry ? edit : e))
    );
  };

  const addEntry = (
    original: {
      expose: NonNullable<typeof exposedEdit>[0];
      rule: NonNullable<typeof exposedEdit>[0]["rules"][0];
    },
    add: NonNullable<typeof exposedEdit>[0]["rules"][0][0]
  ) => {
    editRule(original, original.rule.concat([add]));
  };

  const removeEntry = (original: {
    expose: NonNullable<typeof exposedEdit>[0];
    rule: NonNullable<typeof exposedEdit>[0]["rules"][0];
    entry: NonNullable<typeof exposedEdit>[0]["rules"][0][0];
  }) => {
    editRule(
      original,
      original.rule.filter((e) => e !== original.entry)
    );
  };

  const { data: apps } = useContainers({
    session,
  });
  const [newDomain, setNewDomain] = useState<string>("");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Expose OS</DialogTitle>
        <DialogDescription>
          Expose apps to the public internet.
        </DialogDescription>
      </DialogHeader>
      {config && (
        <div className="flex flex-col gap-2">
          {exposedEdit && (
            <ScrollArea className="h-[500px]">
              <ScrollBar orientation="horizontal" />
              <Accordion type="single" collapsible>
                {exposedEdit.map((expose) => (
                  <AccordionItem key={expose.domain} value={expose.domain}>
                    <AccordionTrigger>
                      <div className="flex gap-2 place-items-center">
                        <span className="font-semibold">
                          {expose.domain.replaceAll('"', "")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            removeExpose({ expose });
                          }}
                        >
                          <Trash2 className="text-red-600" />
                        </Button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-3 mr-2">
                        {expose.rules.map((rule, i) => (
                          <div key={i} className="flex flex-col gap-1 ml-2">
                            <div className="flex gap-2 place-items-center">
                              <span className="font-semibold">
                                Rule #{i + 1}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  removeRule({ expose, rule });
                                }}
                              >
                                <Trash2 className="text-red-600" />
                              </Button>
                            </div>
                            {rule.map((entry, i) => (
                              <div
                                key={i}
                                className="flex gap-2 ml-2 place-content-between place-items-center"
                              >
                                <span>{entry.key}</span>
                                {entry.key === "forward" ? (
                                  <ForwardEditor
                                    value={entry.value}
                                    onChange={(change) => {
                                      editEntry(
                                        { expose, rule, entry },
                                        { ...entry, value: change }
                                      );
                                    }}
                                    apps={apps}
                                  />
                                ) : (
                                  <div className="flex gap-2">
                                    <Input
                                      value={entry.value}
                                      onChange={(change) => {
                                        editEntry(
                                          { expose, rule, entry },
                                          {
                                            ...entry,
                                            value: `"${change.target.value.replaceAll(
                                              '"',
                                              ""
                                            )}"`,
                                          }
                                        );
                                      }}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        removeEntry({ expose, rule, entry });
                                      }}
                                    >
                                      <Trash2 className="text-red-600" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {["forward"]
                              .concat(
                                rule
                                  .find((entry) => entry.key === "forward")
                                  ?.value.replace('"', "")
                                  .startsWith("http")
                                  ? ["path"]
                                  : []
                              )
                              .map(
                                (key) =>
                                  !rule.some((entry) => entry.key === key) && (
                                    <Button
                                      key={key}
                                      className="flex gap-2"
                                      onClick={() => {
                                        addEntry(
                                          { expose, rule },
                                          { key, value: '""' }
                                        );
                                      }}
                                    >
                                      <Plus />
                                      <span>Add {key}</span>
                                    </Button>
                                  )
                              )}
                          </div>
                        ))}
                        <Button
                          className="flex gap-2 mt-2"
                          onClick={() => {
                            addRule({ expose }, [
                              { key: "forward", value: "" },
                            ]);
                          }}
                        >
                          <Plus />
                          <span>Add Rule</span>
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          )}
          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />
            <Button
              className="flex gap-2"
              onClick={() => {
                addExpose({
                  raw: undefined,
                  domain: `"${newDomain}"`,
                  rules: [],
                });
                setNewDomain("");
              }}
            >
              <Plus />
              <span>Add domain</span>
            </Button>
          </div>
        </div>
      )}
      {exposed && (
        <DialogFooter>
          <Button
            onClick={() => {
              setExposedEdit(exposed);
            }}
            disabled={exposedEdit === exposed}
          >
            Reset
          </Button>
          {session && config && userConfig !== undefined && (
            <DialogClose asChild>
              <Button
                onClick={() => {
                  let newUserConfig = userConfig;
                  exposedEdit?.forEach((expose) => {
                    const exposeConfig = `services.xnode-reverse-proxy.rules.${
                      expose.domain
                    } = [ ${expose.rules
                      .map(
                        (rule) =>
                          `{ ${rule
                            .map((entry) => `${entry.key} = ${entry.value};`)
                            .join(" ")} }`
                      )
                      .join(" ")} ];`;
                    if (expose.raw) {
                      newUserConfig = newUserConfig.replace(
                        expose.raw,
                        exposeConfig
                      );
                    } else {
                      const close = newUserConfig.lastIndexOf("}");
                      newUserConfig =
                        newUserConfig.slice(0, close) + `${exposeConfig}\n}`;
                    }
                  });
                  setOS({
                    session,
                    os: {
                      flake: config.flake.replace(userConfig, newUserConfig),
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

function ForwardEditor({
  value,
  onChange,
  apps,
}: {
  value: string;
  onChange: (value: string) => void;
  apps?: string[];
}) {
  const { protocol, app, port } = useMemo(() => {
    const topSplit = value.replaceAll('"', "").split("://").reverse(); // reverse, in case split is not found, protocol is undefined, main body gets passed on
    const protocol = topSplit.at(1) ?? "";
    const portSplit = topSplit.at(0)?.split(":");
    const app = portSplit?.at(0) ?? "";
    const port = portSplit?.at(1) ?? "";
    return { protocol, app, port };
  }, [value]);

  return (
    <div className="flex gap-1 place-items-center">
      <Select
        value={protocol}
        onValueChange={(v) => onChange(`"${v}://${app}:${port}"`)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="http">HTTP</SelectItem>
          <SelectItem value="https">HTTPS</SelectItem>
          <SelectItem value="tcp">TCP</SelectItem>
          <SelectItem value="udp">UDP</SelectItem>
        </SelectContent>
      </Select>
      <span>://</span>
      {apps ? (
        <Select
          value={app}
          onValueChange={(v) => onChange(`"${protocol}://${v}:${port}"`)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {apps.map((app) => (
              <SelectItem key={app} value={app}>
                {app}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          className="w-auto"
          value={app}
          onChange={(e) =>
            onChange(`"${protocol}://${e.target.value}:${port}"`)
          }
        />
      )}
      <span>:</span>
      <Input
        className="w-auto"
        type="number"
        step={1}
        min={0}
        max={65535}
        value={port}
        onChange={(e) => onChange(`"${protocol}://${app}:${e.target.value}"`)}
      />
    </div>
  );
}
