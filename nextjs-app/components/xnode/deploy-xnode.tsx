"use client";

import { useAddress } from "@/hooks/useAddress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import HardwareSelector from "../deployment/hardware-selector";
import { Separator } from "../ui/separator";
import { HardwareProduct } from "@/lib/hardware";
import { useState } from "react";
import HardwareDeployer from "../deployment/hardware-deployer";
import { useSetSettings, useSettings, Xnode } from "../context/settings";
import { useSignMessage } from "wagmi";

export function DeployXnode() {
  const address = useAddress();
  const [open, setOpen] = useState<boolean>(false);
  const [step, setStep] = useState<
    { type: "select" } | { type: "deploy"; hardware: HardwareProduct }
  >({ type: "select" });

  const settings = useSettings();
  const setSettings = useSetSettings();
  const { signMessageAsync } = useSignMessage();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!address}>Deploy</Button>
      </DialogTrigger>
      {step.type === "select" && (
        <DialogContent className="sm:max-w-7xl">
          <DialogHeader>
            <DialogTitle>Select Hardware Product</DialogTitle>
            <DialogDescription>
              Aggregation of hardware available for rental from several cloud
              providers.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <HardwareSelector
            onSelect={(hardware) => setStep({ type: "deploy", hardware })}
          />
        </DialogContent>
      )}
      {step.type === "deploy" && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy Hardware Product</DialogTitle>
            <DialogDescription>
              Aggregation of hardware available for rental from several cloud
              providers.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <HardwareDeployer
            hardware={step.hardware}
            onDeployed={(machine) => {
              const messageDomain = "manager.xnode.local";
              const messageTimestamp = Math.round(Date.now() / 1000);

              signMessageAsync({
                message: `Xnode Auth authenticate ${messageDomain} at ${messageTimestamp}`,
              }).then(async (signature) => {
                setSettings({
                  ...settings,
                  xnodes: [
                    ...settings.xnodes,
                    {
                      insecure: machine.ipAddress,
                      owner: machine.owner,
                      deploymentAuth: machine.deploymentAuth,
                      loginArgs: {
                        user: machine.owner,
                        signature,
                        timestamp: messageTimestamp.toString(),
                      },
                    } as Xnode,
                  ],
                });
                setStep({ type: "select" });
                setOpen(false);
              });
            }}
            onCancel={() => setStep({ type: "select" })}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}
