"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import appstore from "@/public/appstore.json";
import { AppDeploy } from "./deploy";
import { xnode } from "@openmesh-network/xnode-manager-sdk";

export interface AppStoreParams {
  session?: xnode.utils.Session;
  exclude?: string[];
}

export function AppStore(params: AppStoreParams) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex gap-2 max-w-28">
          <Plus />
          <span>Add App</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col sm:max-w-7xl">
        <AppStoreInner {...params} />
      </DialogContent>
    </Dialog>
  );
}

export function AppStoreInner({ session, exclude }: AppStoreParams) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>App Store</DialogTitle>
        <DialogDescription>Deploy new apps to your Xnode</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-4 gap-2 max-md:grid-cols-2">
        {appstore
          .filter((app) => !exclude?.includes(app.name))
          .map((app) => (
            <AppDeploy
              key={app.name}
              session={session}
              template={{
                containerId: app.name,
                flake: app.flake,
                network: "containernet",
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{app.name}</CardTitle>
                </CardHeader>
              </Card>
            </AppDeploy>
          ))}
      </div>
    </>
  );
}
