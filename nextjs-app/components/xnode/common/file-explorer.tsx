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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { xnode } from "@openmesh-network/xnode-manager-sdk";
import {
  useFileCreateDirectory,
  useFileReadDirectory,
  useFileReadFile,
  useFileRemoveDirectory,
  useFileRemoveFile,
  useFileWriteFile,
} from "@openmesh-network/xnode-manager-sdk-react";
import { Folder, FileIcon, Trash2, FilePlus, FolderPlus } from "lucide-react";
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
  const { mutate: remove_file } = useFileRemoveFile();
  const { mutate: create_directory } = useFileCreateDirectory();
  const { mutate: remove_directory } = useFileRemoveDirectory();

  const [currentDir, setCurrentDir] = useState<string>("/");
  const { data: currentDirContents } = useFileReadDirectory({
    session,
    scope,
    path: currentDir,
  });

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

  const segments = useMemo(
    () =>
      (currentDir ? currentDir.split("/").slice(1, -1) : []).concat(
        currentFile ? [currentFile.split("/").at(-1) as string] : []
      ),
    [currentDir, currentFile]
  );

  const [newFile, setNewFile] = useState<string | undefined>(undefined);
  const [newDir, setNewDir] = useState<string | undefined>(undefined);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{scope} file explorer</DialogTitle>
        <DialogDescription>
          View and edit files contained in {scope}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <div className="flex place-items-center">
          <Breadcrumb className="grow">
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
                        if (
                          currentFile &&
                          s === currentFile.split("/").at(-1)
                        ) {
                          return;
                        }

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
            </BreadcrumbList>
          </Breadcrumb>
          {currentFile === undefined && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline">...</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    setNewFile("");
                  }}
                >
                  <div className="flex place-items-center gap-2">
                    <FilePlus />
                    <span>Create File</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setNewDir("");
                  }}
                >
                  <div className="flex place-items-center gap-2">
                    <FolderPlus />
                    <span>Create Folder</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {!currentFileContents && (
          <ScrollArea className="h-[700px]">
            {currentDirContents && (
              <div className="flex flex-col">
                {currentDirContents.directories.map((d) => (
                  <div key={`${currentDir}${d}/`} className="flex">
                    <Button
                      variant="outline"
                      className="flex gap-2 justify-start grow"
                      onClick={() => setCurrentDir(`${currentDir}${d}/`)}
                    >
                      <Folder />
                      <span>{d}</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="outline">...</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {session && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              remove_directory({
                                session,
                                path: { scope },
                                data: {
                                  path: `${currentDir}${d}/`,
                                  make_empty: true,
                                },
                              });
                            }}
                          >
                            <div className="flex place-items-center gap-2">
                              <Trash2 className="text-red-600" />
                              <span>Delete</span>
                            </div>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                {currentDirContents.files.map((f) => (
                  <div key={`${currentDir}${f}`} className="flex">
                    <Button
                      variant="outline"
                      className="flex gap-2 justify-start grow"
                      onClick={() => {
                        setFileEdit("");
                        setCurrentFile(`${currentDir}${f}`);
                      }}
                    >
                      <FileIcon />
                      <span>{f}</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="outline">...</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {session && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              remove_file({
                                session,
                                path: { scope },
                                data: {
                                  path: `${currentDir}${f}`,
                                },
                              });
                            }}
                          >
                            <div className="flex place-items-center gap-2">
                              <Trash2 className="text-red-600" />
                              <span>Delete</span>
                            </div>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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

      <Dialog
        open={newFile !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setNewFile(undefined);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <Label>Parent Directory</Label>
            <Input
              className="bg-muted text-muted-foreground"
              value={currentDir}
              readOnly
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>File Name</Label>
            <Input
              value={newFile}
              onChange={(e) => setNewFile(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            {session && (
              <Button
                onClick={() => {
                  write_file({
                    session,
                    path: { scope },
                    data: { path: `${currentDir}${newFile}`, content: [] },
                  });
                  setNewFile(undefined);
                }}
              >
                Create
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={newDir !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setNewDir(undefined);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <Label>Parent Directory</Label>
            <Input
              className="bg-muted text-muted-foreground"
              value={currentDir}
              readOnly
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Folder Name</Label>
            <Input value={newDir} onChange={(e) => setNewDir(e.target.value)} />
          </div>
          <DialogFooter>
            <DialogClose>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            {session && (
              <Button
                onClick={() => {
                  create_directory({
                    session,
                    path: { scope },
                    data: {
                      path: `${currentDir}${newDir}`,
                      make_parent: true,
                    },
                  });
                  setNewDir(undefined);
                }}
              >
                Create
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
