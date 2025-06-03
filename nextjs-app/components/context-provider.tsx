import { ReactNode } from "react";
import Web3Provider from "./web3-provider";
import { SettingsProvider } from "./context/settings";
import { Toaster } from "./ui/sonner";
import { XnodeManagerSDKProvider } from "./xnode-provider";

export function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  return (
    <SettingsProvider>
      <XnodeManagerSDKProvider>
        <Web3Provider cookies={cookies}>
          {children}
          <Toaster />
        </Web3Provider>
      </XnodeManagerSDKProvider>
    </SettingsProvider>
  );
}
