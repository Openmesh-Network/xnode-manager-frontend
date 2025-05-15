import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet } from "viem/chains";
import { createStorage, cookieStorage } from "wagmi";
import { siteConfig } from "./site";

// Get projectId from https://cloud.reown.com
export const projectId = "5b559f2f66fb806d1eb96035dbf45882";

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const networks = [mainnet] as const;

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }) as any,
  ssr: true,
  projectId,
  networks: [...networks],
});

// Set up metadata
export const metadata = {
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  icons: [`${siteConfig.url}/icon.svg`],
};
