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
import { useEffect, useMemo, useState } from "react";
import { useRequestPopup } from "../request-popup";
import { Input } from "@/components/ui/input";
import { useUserConfig } from "@/hooks/useUserConfig";
import { Coffee, Plus, Trash2 } from "lucide-react";
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
import { xnode } from "@openmesh-network/xnode-manager-sdk";
import {
  useConfigContainers,
  useOsGet,
  useOsSet,
} from "@openmesh-network/xnode-manager-sdk-react";
import { Checkbox } from "@/components/ui/checkbox";
import { rawListeners } from "process";
import { Label } from "@/components/ui/label";

export interface OSExposeParams {
  session?: xnode.utils.Session;
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

  const authenticated = useMemo(() => {
    if (!userConfig) {
      return undefined;
    }

    const domainRegex = new RegExp(
      /services.xnode-auth.domains.(.*)=[^}]*{((?:\n|.)*?)};/g
    );
    const accessListRegex = new RegExp(
      /accessList[^=]*=[^\]]*\[((?:\n|.)*?)\];/g
    );
    const pathsRegex = new RegExp(/paths[^=]*=[^\]]*\[((?:\n|.)*?)\];/g);
    const entryRegex = new RegExp(/"(.*?)"/g);

    return userConfig
      .matchAll(domainRegex)
      .map((expose) => {
        const domain = expose.at(1)?.trim() ?? "UNKNOWN";
        const accessList =
          expose
            .at(2)
            ?.matchAll(accessListRegex)
            .map(
              (rule) =>
                rule
                  .at(1)
                  ?.matchAll(entryRegex)
                  .map((entry) => entry.at(1)?.trim())
                  .toArray()
                  .at(0) ?? "UNKNOWN"
            )
            .toArray() ?? [];
        const paths =
          expose
            .at(2)
            ?.matchAll(pathsRegex)
            .map(
              (rule) =>
                rule
                  .at(1)
                  ?.matchAll(entryRegex)
                  .map((entry) => entry.at(1)?.trim())
                  .toArray()
                  .at(0) ?? "UNKNOWN"
            )
            .toArray() ?? [];
        return { raw: expose.at(0), domain, accessList, paths };
      })
      .toArray();
  }, [userConfig]);

  const [authenticatedEdit, setAuthenticatedEdit] = useState<
    typeof authenticated
  >([]);
  useEffect(() => {
    setAuthenticatedEdit(authenticated);
  }, [authenticated]);

  const editAuthenticated = (
    domain: string,
    edit: Partial<NonNullable<typeof authenticatedEdit>[0]>
  ) => {
    const existing = authenticatedEdit?.find((a) => a.domain === domain);
    setAuthenticatedEdit(
      existing
        ? authenticatedEdit?.map((a) =>
            a === existing ? { ...a, ...edit } : a
          )
        : authenticatedEdit?.concat([
            {
              raw: undefined,
              domain,
              accessList: [],
              paths: [],
              ...edit,
            },
          ])
    );
  };

  const { data: apps } = useConfigContainers({
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
                        <div className="flex gap-2">
                          <Label htmlFor="xnode-auth">Restrict Access</Label>
                          <Checkbox
                            id="xnode-auth"
                            checked={authenticatedEdit?.some(
                              (a) =>
                                a.domain === expose.domain && a.paths.length > 0
                            )}
                            onCheckedChange={(c) => {
                              if (c === "indeterminate") {
                                return;
                              }

                              if (c) {
                                editAuthenticated(expose.domain, {
                                  paths: expose.rules
                                    .filter((r) =>
                                      r.some(
                                        (e) =>
                                          e.key === "forward" &&
                                          e.value
                                            .replace('"', "")
                                            .startsWith("http")
                                      )
                                    )
                                    .map((r) =>
                                      (
                                        r.find((e) => e.key === "path") ?? {
                                          value: '"/"',
                                        }
                                      ).value.replaceAll('"', "")
                                    )
                                    .filter((e) => e !== undefined),
                                });
                              } else {
                                editAuthenticated(expose.domain, {
                                  paths: [],
                                });
                              }
                            }}
                          />
                        </div>
                        {authenticatedEdit?.some(
                          (a) =>
                            a.domain === expose.domain && a.paths.length > 0
                        ) && (
                          <div className="flex flex-col gap-1">
                            {authenticatedEdit
                              ?.find((a) => a.domain === expose.domain)
                              ?.accessList.map((a, i) => (
                                <div className="flex gap-1">
                                  <Input
                                    key={i}
                                    value={a}
                                    onChange={(e) =>
                                      editAuthenticated(expose.domain, {
                                        accessList: authenticatedEdit
                                          ?.find(
                                            (a) => a.domain === expose.domain
                                          )
                                          ?.accessList.map((acc) =>
                                            acc === a ? e.target.value : acc
                                          ),
                                      })
                                    }
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      editAuthenticated(expose.domain, {
                                        accessList: authenticatedEdit
                                          ?.find(
                                            (a) => a.domain === expose.domain
                                          )
                                          ?.accessList.filter(
                                            (acc) => acc !== a
                                          ),
                                      });
                                    }}
                                  >
                                    <Trash2 className="text-red-600" />
                                  </Button>
                                </div>
                              ))}
                            <Button
                              className="flex gap-2"
                              onClick={() => {
                                editAuthenticated(expose.domain, {
                                  accessList: authenticatedEdit
                                    ?.find((a) => a.domain === expose.domain)
                                    ?.accessList.concat([
                                      config.xnode_owner ?? "",
                                    ]),
                                });
                              }}
                            >
                              <Plus />
                              <span>Add</span>
                            </Button>
                          </div>
                        )}
                        <div className="flex flex-col gap-3">
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
                                    if (
                                      authenticatedEdit?.some(
                                        (a) => a.domain === expose.domain
                                      ) &&
                                      rule.some(
                                        (entry) =>
                                          entry.key === "forward" &&
                                          entry.value
                                            .replace('"', "")
                                            .startsWith("http")
                                      )
                                    ) {
                                      const path = (
                                        rule.find(
                                          (entry) => entry.key === "path"
                                        ) ?? {
                                          value: '"/"',
                                        }
                                      ).value.replaceAll('"', "");
                                      editAuthenticated(expose.domain, {
                                        paths: authenticatedEdit
                                          ?.find(
                                            (a) => a.domain === expose.domain
                                          )
                                          ?.paths.filter((p) => p !== path),
                                      });
                                    }
                                    removeRule({ expose, rule });
                                  }}
                                >
                                  <Trash2 className="text-red-600" />
                                </Button>
                              </div>
                              {authenticatedEdit?.some(
                                (a) =>
                                  a.domain === expose.domain &&
                                  a.paths.length > 0
                              ) &&
                                rule.some(
                                  (entry) =>
                                    entry.key === "forward" &&
                                    entry.value
                                      .replace('"', "")
                                      .startsWith("http")
                                ) && (
                                  <div className="flex gap-2">
                                    <Label
                                      htmlFor={`xnode-auth-${
                                        rule.find(
                                          (entry) => entry.key === "path"
                                        ) ?? {
                                          value: '"/"',
                                        }
                                      }`}
                                    >
                                      Restricted
                                    </Label>
                                    <Checkbox
                                      id={`xnode-auth-${
                                        rule.find(
                                          (entry) => entry.key === "path"
                                        ) ?? {
                                          value: '"/"',
                                        }
                                      }`}
                                      checked={authenticatedEdit
                                        .find((a) => a.domain === expose.domain)
                                        ?.paths.includes(
                                          (
                                            rule.find(
                                              (entry) => entry.key === "path"
                                            ) ?? {
                                              value: '"/"',
                                            }
                                          ).value.replaceAll('"', "")
                                        )}
                                      onCheckedChange={(c) => {
                                        if (c === "indeterminate") {
                                          return;
                                        }

                                        if (
                                          !authenticatedEdit?.some(
                                            (a) => a.domain === expose.domain
                                          )
                                        ) {
                                          return;
                                        }

                                        const path = (
                                          rule.find(
                                            (entry) => entry.key === "path"
                                          ) ?? {
                                            value: '"/"',
                                          }
                                        ).value.replaceAll('"', "");
                                        if (c) {
                                          editAuthenticated(expose.domain, {
                                            paths: authenticatedEdit
                                              ?.find(
                                                (a) =>
                                                  a.domain === expose.domain
                                              )
                                              ?.paths.concat([path]),
                                          });
                                        } else {
                                          editAuthenticated(expose.domain, {
                                            paths: authenticatedEdit
                                              ?.find(
                                                (a) =>
                                                  a.domain === expose.domain
                                              )
                                              ?.paths.filter((p) => p !== path),
                                          });
                                        }
                                      }}
                                    />
                                  </div>
                                )}
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
                                          const newValue = `"${change.target.value.replaceAll(
                                            '"',
                                            ""
                                          )}"`;
                                          if (
                                            entry.key === "path" &&
                                            authenticatedEdit?.some(
                                              (a) => a.domain === expose.domain
                                            )
                                          ) {
                                            editAuthenticated(expose.domain, {
                                              paths: authenticatedEdit
                                                ?.find(
                                                  (a) =>
                                                    a.domain === expose.domain
                                                )
                                                ?.paths.map((p) =>
                                                  `"${p}"` === entry.value
                                                    ? newValue.replaceAll(
                                                        '"',
                                                        ""
                                                      )
                                                    : p
                                                ),
                                            });
                                          }
                                          editEntry(
                                            { expose, rule, entry },
                                            {
                                              ...entry,
                                              value: newValue,
                                            }
                                          );
                                        }}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (
                                            authenticatedEdit?.some(
                                              (a) => a.domain === expose.domain
                                            )
                                          ) {
                                            const path = (
                                              rule.find(
                                                (entry) => entry.key === "path"
                                              ) ?? {
                                                value: '"/"',
                                              }
                                            ).value.replaceAll('"', "");

                                            if (path !== "/") {
                                              editAuthenticated(expose.domain, {
                                                paths: authenticatedEdit
                                                  ?.find(
                                                    (a) =>
                                                      a.domain === expose.domain
                                                  )
                                                  ?.paths.map((p) =>
                                                    p === path ? "/" : p
                                                  ),
                                              });
                                            }
                                          }
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
                                    !rule.some(
                                      (entry) => entry.key === key
                                    ) && (
                                      <Button
                                        key={key}
                                        className="flex gap-2"
                                        onClick={() => {
                                          addEntry(
                                            { expose, rule },
                                            {
                                              key,
                                              value:
                                                key === "path" ? '"/"' : "",
                                            }
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
      {exposed && authenticated && (
        <DialogFooter>
          <Button
            onClick={() => {
              setExposedEdit(exposed);
              setAuthenticatedEdit(authenticated);
            }}
            disabled={
              exposedEdit === exposed && authenticatedEdit === authenticated
            }
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
                  authenticatedEdit?.forEach((authenticate) => {
                    const exposeConfig = `services.xnode-auth.domains.${
                      authenticate.domain
                    } = { accessList = [ ${authenticate.accessList
                      .map((a) => `"${a}"`)
                      .join(" ")} ]; paths = [ ${authenticate.paths
                      .map((a) => `"${a}"`)
                      .join(" ")} ]; };`;
                    if (authenticate.raw) {
                      newUserConfig = newUserConfig.replace(
                        authenticate.raw,
                        exposeConfig
                      );
                    } else {
                      const close = newUserConfig.lastIndexOf("}");
                      newUserConfig =
                        newUserConfig.slice(0, close) + `${exposeConfig}\n}`;
                    }
                  });
                  set({
                    session,
                    data: {
                      flake: config.flake.replace(userConfig, newUserConfig),
                      xnode_owner: null,
                      domain: null,
                      acme_email: null,
                      user_passwd: null,
                      update_inputs: null,
                    },
                  });
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
