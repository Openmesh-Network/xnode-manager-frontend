import { useMemo } from "react";

function extractUserConfig({ config }: { config: string }) {
  return config
    .split("# START USER CONFIG")
    .at(1)
    ?.split("# END USER CONFIG")
    .at(0)
    ?.split("\n")
    .slice(1, -1)
    .join("\n");
}

export function useUserConfig({ config }: { config?: string }) {
  return useMemo(
    () => (config ? extractUserConfig({ config }) : undefined),
    [config]
  );
}

export function replaceUserConfig({
  userConfig,
  config,
}: {
  userConfig?: string;
  config?: string;
}) {
  if (!config) {
    return undefined;
  }

  const startSplit = config.split("# START USER CONFIG");
  const endSplit = startSplit.at(1)?.split("# END USER CONFIG");
  const beforeUserConfig = startSplit[0];
  const afterUserConfig = endSplit?.at(1);
  return !afterUserConfig || !userConfig
    ? undefined
    : `${beforeUserConfig}# START USER CONFIG${userConfig}# END USER CONFIG${afterUserConfig}`;
}

export function useKeepUserConfig({
  config,
  updatedConfig,
}: {
  config?: string;
  updatedConfig?: string;
}) {
  const userConfig = useMemo(() => {
    if (!config) {
      return undefined;
    }

    return config
      .split("# START USER CONFIG")
      .at(1)
      ?.split("# END USER CONFIG")
      .at(0);
  }, [config]);

  return replaceUserConfig({ config: updatedConfig, userConfig });
}
