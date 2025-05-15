"use client";

import {
  useContainerConfig,
  useDirectory,
  useFile,
  useLogs,
  useProcesses,
} from "@/hooks/useXnode";
import { changeConfig, Session, writeFile } from "@/lib/xnode";
import { Card, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Title } from "../text";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { ArrowLeft, CheckCircle, FileIcon, Folder, X } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Ansi } from "../ui/ansi";

export function App({
  session,
  containerId,
}: {
  session?: Session;
  containerId: string;
}) {
  const { data: config } = useContainerConfig({
    session,
    containerId,
  });

  const { data: processes } = useProcesses({
    session,
    containerId,
  });
  const [currentProcess, setCurrentProcess] = useState<string | undefined>(
    undefined
  );

  const { data: currentProcessLogs } = useLogs({
    session,
    containerId,
    process: currentProcess,
  });
  const logsScrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollLogToBottom = useMemo(() => {
    return () => {
      const scrollArea = logsScrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    };
  }, [logsScrollAreaRef]);
  useEffect(() => {
    scrollLogToBottom();
  }, [currentProcessLogs, scrollLogToBottom]);

  const [currentDir, setCurrentDir] = useState<string | undefined>(undefined);
  const { data: currentDirContents, refetch: refetchDirContents } =
    useDirectory({
      session,
      containerId,
      path: currentDir,
    });
  const segments = useMemo(
    () => (currentDir ? currentDir.split("/").slice(1, -1) : []),
    [currentDir]
  );

  const [currentFile, setCurrentFile] = useState<string | undefined>(undefined);
  const { data: currentFileContents, refetch: refetchFileContents } = useFile({
    session,
    containerId,
    path: currentFile,
  });
  const [fileEdit, setFileEdit] = useState<string>("");

  const [networkEdit, setNetworkEdit] = useState<string>("");
  const [flakeEdit, setFlakeEdit] = useState<string>("");

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle>
          <Title title={containerId} />
        </CardTitle>
      </CardHeader>
      <CardFooter>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Logs</Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col sm:max-w-7xl">
              <DialogHeader>
                <DialogTitle>{containerId} logs</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                {processes && !currentProcess && (
                  <ScrollArea className="h-[700px]">
                    <div className="flex flex-col">
                      {processes
                        .sort((p1, p2) => {
                          if (p1.running && !p2.running) {
                            return -1;
                          }

                          if (p2.running && !p1.running) {
                            return 1;
                          }

                          return 0;
                        })
                        .map((p, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            className="flex gap-2 justify-start"
                            onClick={() => setCurrentProcess(p.name)}
                          >
                            {p.running ? <CheckCircle /> : <X />}
                            <span>
                              {p.name}: {p.description}
                            </span>
                          </Button>
                        ))}
                    </div>
                  </ScrollArea>
                )}
                {currentProcess && (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-5 place-items-center">
                      <Button
                        className="flex gap-2"
                        onClick={() => setCurrentProcess(undefined)}
                      >
                        <ArrowLeft />
                        <span>Back</span>
                      </Button>
                      <span className="text-lg">{currentProcess}</span>
                    </div>
                    {currentProcessLogs && (
                      <div ref={logsScrollAreaRef}>
                        <ScrollArea className="rounded border bg-black h-[500px]">
                          <div className="px-3 py-2 font-mono text-muted flex flex-col">
                            {currentProcessLogs.map((log, i) =>
                              log.message.type === "string" ? (
                                <span key={i}>{log.message.string}</span>
                              ) : (
                                <Ansi key={i}>
                                  {Buffer.from(log.message.bytes).toString(
                                    "utf-8"
                                  )}
                                </Ansi>
                              )
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentDir("/")}>File explorer</Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col sm:max-w-7xl">
              <DialogHeader>
                <DialogTitle>{containerId} file explorer</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbLink
                      onClick={() => {
                        setCurrentFile(undefined);
                        setCurrentDir("/");
                      }}
                    >
                      root
                    </BreadcrumbLink>
                    {segments
                      .slice(0, -1)
                      .map((s, i) => (
                        <BreadcrumbItem key={i * 2}>
                          <BreadcrumbLink
                            onClick={() => {
                              setCurrentFile(undefined);
                              setCurrentDir(
                                `/${segments.slice(0, i + 1).join("/")}/`
                              );
                            }}
                          >
                            {s}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      ))
                      .flatMap((x, i) => [
                        <BreadcrumbSeparator key={i * 2 + 1} />,
                        x,
                      ])}
                    {segments.length > 0 && (
                      <>
                        <BreadcrumbSeparator />
                        <BreadcrumbPage>{segments.at(-1)}</BreadcrumbPage>
                      </>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
                {!currentFileContents && (
                  <ScrollArea className="h-[700px]">
                    {currentDirContents && (
                      <div className="flex flex-col">
                        {currentDirContents.directories.map((d, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            className="flex gap-2 justify-start"
                            onClick={() => setCurrentDir(`${currentDir}${d}/`)}
                          >
                            <Folder />
                            <span>{d}</span>
                          </Button>
                        ))}
                        {currentDirContents.files.map((f, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            className="flex gap-2 justify-start"
                            onClick={() => {
                              setFileEdit("");
                              setCurrentFile(`${currentDir}${f}`);
                            }}
                          >
                            <FileIcon />
                            <span>{f}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                )}
                {currentFileContents && (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      className="max-h-96"
                      value={fileEdit ? fileEdit : currentFileContents.content}
                      onChange={(e) => setFileEdit(e.target.value)}
                    />
                    {session && currentFile && (
                      <Button
                        disabled={
                          !fileEdit || fileEdit === currentFileContents.content
                        }
                        onClick={() => {
                          writeFile({
                            session,
                            location: {
                              containerId,
                              path: currentFile,
                            },
                            content: fileEdit,
                          }).then(() => refetchFileContents());
                        }}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Edit</Button>
            </DialogTrigger>
            {config && (
              <DialogContent className="flex flex-col sm:max-w-7xl">
                <DialogHeader>
                  <DialogTitle>{containerId} editor</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                  <Item title="Network">
                    <Select
                      value={unwrap_or(
                        networkEdit ? networkEdit : config.network,
                        "host"
                      )}
                      onValueChange={(v) => setNetworkEdit(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="host">host</SelectItem>
                        <SelectItem value="containernet">
                          containernet
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Item>
                  <Item title="Flake">
                    <Textarea
                      className="max-h-96"
                      value={flakeEdit ? flakeEdit : config.flake}
                      onChange={(e) => setFlakeEdit(e.target.value)}
                    />
                  </Item>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setFlakeEdit("");
                      setNetworkEdit("");
                    }}
                  >
                    Reset
                  </Button>
                  {session && (
                    <Button
                      onClick={() => {
                        changeConfig({
                          session,
                          changes: [
                            {
                              Set: {
                                container: containerId,
                                settings: {
                                  flake: flakeEdit ? flakeEdit : config.flake,
                                  network: networkEdit
                                    ? networkEdit === "host"
                                      ? ""
                                      : networkEdit
                                    : config.network,
                                },
                              },
                            },
                          ],
                        });
                      }}
                    >
                      Apply
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            )}
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}

function unwrap_or(option_str: string | undefined, or: string) {
  if (!option_str) {
    return or;
  }

  return option_str;
}

function Item({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{title}</Label>
      {children}
    </div>
  );
}
