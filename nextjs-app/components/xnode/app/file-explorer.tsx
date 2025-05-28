"use client";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
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
import { Textarea } from "@/components/ui/textarea";
import { useDirectory, useFile } from "@/hooks/useXnode";
import { Session, writeFile } from "@/lib/xnode";
import { Folder, FileIcon } from "lucide-react";
import { useState, useMemo } from "react";

export interface AppFileExplorerParams {
  session?: Session;
  containerId: string;
}

export function AppFileExplorer(params: AppFileExplorerParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>File Explorer</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col sm:max-w-7xl">
        <AppFileExplorerInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

export function AppFileExplorerInner({
  session,
  containerId,
}: AppFileExplorerParams) {
  const [currentDir, setCurrentDir] = useState<string>("/");
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

  return (
    <>
      <DialogHeader>
        <DialogTitle>{containerId} file explorer</DialogTitle>
        <DialogDescription>
          View and edit files contained in the app
        </DialogDescription>
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
                      setCurrentDir(`/${segments.slice(0, i + 1).join("/")}/`);
                    }}
                  >
                    {s}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ))
              .flatMap((x, i) => [<BreadcrumbSeparator key={i * 2 + 1} />, x])}
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
                {currentDirContents.directories.map((d) => (
                  <Button
                    key={d}
                    variant="outline"
                    className="flex gap-2 justify-start"
                    onClick={() => setCurrentDir(`${currentDir}${d}/`)}
                  >
                    <Folder />
                    <span>{d}</span>
                  </Button>
                ))}
                {currentDirContents.files.map((f) => (
                  <Button
                    key={f}
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
                disabled={!fileEdit || fileEdit === currentFileContents.content}
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
    </>
  );
}
