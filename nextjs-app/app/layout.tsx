import "@/app/globals.css";

import { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { headers } from "next/headers";
import { ContextProvider } from "@/components/context-provider";

const inter = localFont({
  src: "./InterVariable.ttf",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookies = (await headers()).get("cookie");

  return (
    <>
      <html>
        <head />
        <body className={cn("min-h-screen antialiased", inter.className)}>
          <Header />
          <ContextProvider cookies={cookies}>
            <div className="m-2">{children}</div>
          </ContextProvider>
        </body>
      </html>
    </>
  );
}
