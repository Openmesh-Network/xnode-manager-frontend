"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCommandInfo, useRequestInfo } from "@/hooks/useXnode";
import { RequestInfo, Session } from "@/lib/xnode";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { CheckCircle, Hourglass, X } from "lucide-react";

export interface RequestPopup {
  request_id?: number;
  onFinish?: (result: RequestInfo["result"]) => void;
}
const defaultRequestPopup: RequestPopup = {};
const SetRequestPopupContext = createContext<
  (requestPopup: RequestPopup) => void
>(() => {});

export function RequestPopupProvider({
  session,
  children,
}: {
  session?: Session;
  children: React.ReactNode;
}) {
  const [requestPopup, setRequestPopup] =
    useState<RequestPopup>(defaultRequestPopup);
  const [selectedCommand, setSelectedCommand] = useState<string | undefined>(
    undefined
  );

  const { data: requestInfo } = useRequestInfo({
    session,
    request_id: requestPopup.request_id,
  });

  const close = useMemo(() => {
    return (requestPopup: RequestPopup, result: RequestInfo["result"]) => {
      requestPopup.onFinish?.(result);
      setRequestPopup({});
    };
  }, []);

  useEffect(() => {
    setSelectedCommand(requestInfo?.commands.at(-1));
  }, [requestInfo?.commands]);

  useEffect(() => {
    if (requestInfo && requestInfo.result?.Success) {
      close(requestPopup, requestInfo.result);
    }
  }, [requestPopup, requestInfo]);

  return (
    <SetRequestPopupContext.Provider value={setRequestPopup}>
      {children}
      <AlertDialog open={requestPopup.request_id !== undefined}>
        <AlertDialogContent className="flex flex-col sm:max-w-7xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Request {requestPopup.request_id}
            </AlertDialogTitle>
            <AlertDialogDescription>
              View live request progress. This popup will automatically close
              once the request completed successfully.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {requestInfo && (
            <div className="flex flex-col">
              <Accordion
                type="single"
                value={selectedCommand}
                onValueChange={(c) => setSelectedCommand(c)}
                collapsible
              >
                {requestInfo.commands.map((command) => (
                  <RequestCommand
                    key={command}
                    session={session}
                    request_id={requestPopup.request_id}
                    command={command}
                  />
                ))}
              </Accordion>
              {requestInfo.result && (
                <AlertDialogFooter>
                  <Button
                    onClick={() => {
                      close(requestPopup, requestInfo.result);
                    }}
                  >
                    Close
                  </Button>
                </AlertDialogFooter>
              )}
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </SetRequestPopupContext.Provider>
  );
}

export function RequestCommand({
  session,
  request_id,
  command,
}: {
  session?: Session;
  request_id?: number;
  command: string;
}) {
  const [updateInfo, setUpdateInfo] = useState<boolean>(true);
  const { data: commandInfo } = useCommandInfo({
    session,
    request_id,
    command,
    queryArgs: {
      enable: updateInfo,
    },
  });

  useEffect(() => {
    if (commandInfo?.result) {
      setUpdateInfo(false);
    }
  }, [commandInfo?.result]);

  const errScrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollErrToBottom = useMemo(() => {
    return () => {
      const scrollArea = errScrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    };
  }, [errScrollAreaRef]);
  useEffect(() => {
    scrollErrToBottom();
  }, [commandInfo?.stderr, scrollErrToBottom]);

  return (
    commandInfo && (
      <AccordionItem value={command}>
        <AccordionTrigger>
          <div className="flex gap-2">
            {commandInfo.result === "0" ? (
              <CheckCircle className="shrink-0 text-green-600" />
            ) : commandInfo.result === "1" ? (
              <X className="shrink-0 text-red-600" />
            ) : (
              <Hourglass className="shrink-0" />
            )}
            <span>{commandInfo.command}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div ref={errScrollAreaRef}>
            <ScrollArea className="rounded border bg-black h-[500px]">
              <div className="px-3 py-2 font-mono text-muted flex flex-col">
                {commandInfo.stderr.split("\n").map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </div>
            </ScrollArea>
          </div>
        </AccordionContent>
      </AccordionItem>
    )
  );
}

export function useRequestPopup() {
  return useContext(SetRequestPopupContext);
}
