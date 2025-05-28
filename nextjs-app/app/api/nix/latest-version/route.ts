import { NextRequest } from "next/server";
import { spawn } from "child_process";

export interface LatestVersionReturn {
  lastModified: number;
  revision: string;
}

export async function GET(req: NextRequest) {
  try {
    const flake = req.nextUrl.searchParams.get("flake");
    if (!flake) {
      throw new Error("Missing flake param.");
    }

    const metadata = spawn("nix", [
      "flake",
      "metadata",
      flake,
      "--json",
      "--no-use-registries",
    ]);
    const output: string[] = [];
    metadata.stdout.on("data", (data) => {
      output.push(data.toString());
    });
    await new Promise((resolve) => metadata.on("close", resolve));
    return Response.json(JSON.parse(output.join()));
  } catch (err: any) {
    return Response.json({ error: err?.message ?? err }, { status: 500 });
  }
}
