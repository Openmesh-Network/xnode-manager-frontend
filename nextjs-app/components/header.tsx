import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import Icon from "@/public/icon.svg";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-black h-20 flex items-center">
      <Link href="/" className="flex items-center space-x-2 ml-2">
        <Image alt="Logo" src={Icon} width={36} height={36} priority={true} />
        <span className="inline-block font-bold text-white text-xl">
          {siteConfig.name}
        </span>
      </Link>
      <div className="grow" />
      <div className="mr-2">
        <w3m-button />
      </div>
    </header>
  );
}
