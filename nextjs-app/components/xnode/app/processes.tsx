"use client";

import { Ansi } from "@/components/ui/ansi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLogs, useProcesses } from "@/hooks/useXnode";
import {
  CheckCircle,
  X,
  ArrowLeft,
  Square,
  RefreshCw,
  Play,
} from "lucide-react";
import { useState, useRef, useMemo, useEffect } from "react";
import { useRequestPopup } from "../request-popup";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { xnode } from "@openmesh-network/xnode-manager-sdk";

export interface AppProcessesParams {
  session?: xnode.utils.Session;
  container: string;
}

export function AppProcesses(params: AppProcessesParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Processes</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col sm:max-w-7xl">
        <AppProcessesInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

export function AppProcessesInner({ session, container }: AppProcessesParams) {
  const queryClient = useQueryClient();
  const setRequestPopup = useRequestPopup();

  const { data: processes } = useProcesses({
    session,
    container,
  });
  const [currentProcess, setCurrentProcess] = useState<string | undefined>(
    undefined
  );
  const [startProcess, setStartProcess] = useState<string>("");

  const { data: currentProcessLogs } = useLogs({
    session,
    container,
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

  return (
    <>
      <DialogHeader>
        <DialogTitle>{container} processes</DialogTitle>
        <DialogDescription>
          Inspect and manage processes running in the app
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        {processes && !currentProcess && (
          <>
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
                  .map((p) => (
                    <Button
                      key={p.name}
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
            {session && (
              <div className="flex gap-1">
                <Input
                  value={startProcess}
                  onChange={(e) => setStartProcess(e.target.value)}
                />
                <Button
                  className="flex gap-1"
                  onClick={() => {
                    xnode.process
                      .execute({
                        session,
                        container,
                        process: startProcess,
                        command: "Start",
                      })
                      .then((res) =>
                        setRequestPopup({
                          ...res,
                          onFinish: () => {
                            queryClient.invalidateQueries({
                              queryKey: [
                                "processes",
                                container,
                                session.baseUrl,
                              ],
                            });
                          },
                        })
                      );
                    setStartProcess("");
                  }}
                >
                  <Play />
                  <span>Start</span>
                </Button>
              </div>
            )}
          </>
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
              <div className="grow" />
              {session && (
                <div className="flex gap-1">
                  {processes?.find((p) => p.name === currentProcess)
                    ?.running ? (
                    <>
                      <Button
                        className="flex gap-1"
                        onClick={() => {
                          xnode.process
                            .execute({
                              session,
                              container,
                              process: currentProcess,
                              command: "Stop",
                            })
                            .then((res) =>
                              setRequestPopup({
                                ...res,
                                onFinish: () => {
                                  queryClient.invalidateQueries({
                                    queryKey: [
                                      "processes",
                                      container,
                                      session.baseUrl,
                                    ],
                                  });
                                },
                              })
                            );
                        }}
                      >
                        <Square />
                        <span>Stop</span>
                      </Button>
                      <Button
                        className="flex gap-1"
                        onClick={() => {
                          xnode.process
                            .execute({
                              session,
                              container,
                              process: currentProcess,
                              command: "Restart",
                            })
                            .then((res) =>
                              setRequestPopup({
                                ...res,
                              })
                            );
                        }}
                      >
                        <RefreshCw />
                        <span>Restart</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="flex gap-1"
                      onClick={() => {
                        xnode.process
                          .execute({
                            session,
                            container,
                            process: currentProcess,
                            command: "Start",
                          })
                          .then((res) =>
                            setRequestPopup({
                              ...res,
                              onFinish: () => {
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "processes",
                                    container,
                                    session.baseUrl,
                                  ],
                                });
                              },
                            })
                          );
                      }}
                    >
                      <Play />
                      <span>Start</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
            {currentProcessLogs && (
              <div ref={logsScrollAreaRef}>
                <ScrollArea className="rounded border bg-black h-[500px]">
                  <div className="px-3 py-2 font-mono text-muted flex flex-col">
                    {currentProcessLogs.map((log, i) =>
                      "UTF8" in log.message ? (
                        <span key={i}>{log.message.UTF8.output}</span>
                      ) : (
                        <Ansi key={i}>
                          {Buffer.from(log.message.Bytes.output).toString(
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
    </>
  );
}
