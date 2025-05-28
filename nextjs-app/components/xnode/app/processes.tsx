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
import { executeProcess, Session } from "@/lib/xnode";
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

export interface AppLogsParams {
  session?: Session;
  containerId: string;
}

export function AppLogs(params: AppLogsParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Processes</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col sm:max-w-7xl">
        <AppLogsInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

export function AppLogsInner({ session, containerId }: AppLogsParams) {
  const queryClient = useQueryClient();
  const setRequestPopup = useRequestPopup();

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

  return (
    <>
      <DialogHeader>
        <DialogTitle>{containerId} processes</DialogTitle>
        <DialogDescription>
          Inspect and manage processes running in the app
        </DialogDescription>
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
                          executeProcess({
                            session,
                            containerId,
                            process: currentProcess,
                            command: "Stop",
                          }).then((res) =>
                            setRequestPopup({
                              ...res,
                              onFinish: () => {
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "processes",
                                    containerId,
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
                          executeProcess({
                            session,
                            containerId,
                            process: currentProcess,
                            command: "Restart",
                          }).then((res) =>
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
                        executeProcess({
                          session,
                          containerId,
                          process: currentProcess,
                          command: "Start",
                        }).then((res) =>
                          setRequestPopup({
                            ...res,
                            onFinish: () => {
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "processes",
                                  containerId,
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
                      log.message.type === "string" ? (
                        <span key={i}>{log.message.string}</span>
                      ) : (
                        <Ansi key={i}>
                          {Buffer.from(log.message.bytes).toString("utf-8")}
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
