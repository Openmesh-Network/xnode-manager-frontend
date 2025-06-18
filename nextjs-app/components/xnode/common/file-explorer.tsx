"use client";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbItem,
  BreadcrumbSeparator,
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
import { xnode } from "@openmesh-network/xnode-manager-sdk";
import {
  useFileReadDirectory,
  useFileReadFile,
  useFileWriteFile,
} from "@openmesh-network/xnode-manager-sdk-react";
import { Folder, FileIcon } from "lucide-react";
import { useState, useMemo } from "react";

export interface FileExplorerParams {
  session?: xnode.utils.Session;
  scope: string;
}

export function FileExplorer(params: FileExplorerParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>File Explorer</Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col sm:max-w-7xl">
        <FileExplorerInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

export function FileExplorerInner({ session, scope }: FileExplorerParams) {
  const { mutate: write_file } = useFileWriteFile();

  const [currentDir, setCurrentDir] = useState<string>("/");
  const { data: currentDirContents } = useFileReadDirectory({
    session,
    scope,
    path: currentDir,
  });
  const segments = useMemo(
    () => (currentDir ? currentDir.split("/").slice(1, -1) : []),
    [currentDir]
  );

  const [currentFile, setCurrentFile] = useState<string | undefined>(undefined);
  const { data: currentFileContents } = useFileReadFile({
    session,
    scope,
    path: currentFile,
  });
  const currentFileContentsString = useMemo(() => {
    if (!currentFileContents) {
      return undefined;
    }

    return xnode.utils.output_to_string(currentFileContents.content);
  }, [currentFileContents]);
  const [fileEdit, setFileEdit] = useState<string>("");

  return (
    <>
      <DialogHeader>
        <DialogTitle>{scope} file explorer</DialogTitle>
        <DialogDescription>
          View and edit files contained in {scope}
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
              value={fileEdit ? fileEdit : currentFileContentsString ?? ""}
              onChange={(e) => setFileEdit(e.target.value)}
            />
            {session && currentFile && (
              <Button
                disabled={!fileEdit || fileEdit === currentFileContentsString}
                onClick={() => {
                  write_file({
                    session,
                    path: { scope },
                    data: {
                      path: currentFile,
                      content: xnode.utils.string_to_bytes(fileEdit),
                    },
                  });
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
