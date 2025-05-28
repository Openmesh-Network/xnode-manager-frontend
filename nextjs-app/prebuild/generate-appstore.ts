import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

async function generateAppstore() {
  const baseDir = join(".", "prebuild", "appstore");
  const output = join(".", "public", "appstore.json");

  const appnames = await readdir(baseDir);
  const apps = await Promise.all(
    appnames.map(async (appname) => {
      return {
        name: appname.replace(".nix", ""),
        flake: await readFile(join(baseDir, appname), { encoding: "utf-8" }),
      };
    })
  );
  await writeFile(output, JSON.stringify(apps));
}

generateAppstore().catch(console.error);
