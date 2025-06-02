import { useSettings, Xnode } from "@/components/context/settings";
import { xnode } from "@openmesh-network/xnode-manager-sdk";
import { useQuery } from "@tanstack/react-query";

const usageRefetchInterval = 1000; // 1 sec
const OSRefetchInterval = 20_000; // 20 sec
const containersRefetchInterval = 20_000; // 20 sec
const processesRefetchInterval = 20_000; // 20 sec
const fileRefetchInterval = 20_000; // 20 sec
const logsRefetchInterval = 1000; // 1 sec
const requestInterval = 1000; // 1 sec

export interface QueryArgs {
  enable?: boolean;
}

export function useSession({
  xnode: xnodeServer,
  queryArgs,
}: {
  xnode?: Xnode;
  queryArgs?: QueryArgs;
}) {
  const { wallets } = useSettings();
  return useQuery({
    queryKey: [
      "session",
      xnodeServer?.domain ?? "",
      xnodeServer?.insecure ?? false,
    ],
    enabled: !!xnodeServer && queryArgs?.enable !== false,
    queryFn: async () => {
      if (!xnodeServer) {
        return undefined;
      }

      const baseUrl = xnodeServer.insecure
        ? `/xnode-forward/${xnodeServer.domain}`
        : `https://${xnodeServer.domain}`; // HTTP requests require a forward proxy
      const session = await xnode.auth.login({
        baseUrl,
        sig: wallets[xnodeServer.owner],
      });
      return session;
    },
  });
}

export function useCpu({ session }: { session?: xnode.utils.Session }) {
  return useQuery({
    queryKey: ["cpu", session?.baseUrl ?? ""],
    enabled: !!session,
    queryFn: async () => {
      if (!session) {
        return undefined;
      }

      return await xnode.usage.cpu({ session });
    },
    refetchInterval: usageRefetchInterval,
  });
}

export function useMemory({ session }: { session?: xnode.utils.Session }) {
  return useQuery({
    queryKey: ["memory", session?.baseUrl ?? ""],
    enabled: !!session,
    queryFn: async () => {
      if (!session) {
        return undefined;
      }

      return await xnode.usage.memory({ session });
    },
    refetchInterval: usageRefetchInterval,
  });
}

export function useDisk({ session }: { session?: xnode.utils.Session }) {
  return useQuery({
    queryKey: ["disk", session?.baseUrl ?? ""],
    enabled: !!session,
    queryFn: async () => {
      if (!session) {
        return undefined;
      }

      return await xnode.usage.disk({ session });
    },
    refetchInterval: usageRefetchInterval,
  });
}

export function useOS({ session }: { session?: xnode.utils.Session }) {
  return useQuery({
    queryKey: ["OS", session?.baseUrl ?? ""],
    enabled: !!session,
    queryFn: async () => {
      if (!session) {
        return undefined;
      }

      return await xnode.os.get({ session });
    },
    refetchInterval: OSRefetchInterval,
  });
}

export function useContainers({ session }: { session?: xnode.utils.Session }) {
  return useQuery({
    queryKey: ["containers", session?.baseUrl ?? ""],
    enabled: !!session,
    queryFn: async () => {
      if (!session) {
        return undefined;
      }

      return await xnode.config.containers({ session });
    },
    refetchInterval: containersRefetchInterval,
  });
}

export function useContainerConfig({
  session,
  container,
}: {
  session?: xnode.utils.Session;
  container?: string;
}) {
  return useQuery({
    queryKey: ["container", container, session?.baseUrl ?? ""],
    enabled: !!session && !!container,
    queryFn: async () => {
      if (!session || !container) {
        return undefined;
      }

      return await xnode.config.container({ session, container });
    },
    refetchInterval: containersRefetchInterval,
  });
}

export function useProcesses({
  session,
  container,
}: {
  session?: xnode.utils.Session;
  container?: string;
}) {
  return useQuery({
    queryKey: ["processes", container, session?.baseUrl ?? ""],
    enabled: !!session && !!container,
    queryFn: async () => {
      if (!session || !container) {
        return undefined;
      }

      return await xnode.process.list({ session, container });
    },
    refetchInterval: processesRefetchInterval,
  });
}

export function useLogs({
  session,
  container,
  process,
}: {
  session?: xnode.utils.Session;
  container?: string;
  process?: string;
}) {
  return useQuery({
    queryKey: ["logs", container, process, session?.baseUrl ?? ""],
    enabled: !!session && !!container && !!process,
    queryFn: async () => {
      if (!session || !container || !process) {
        return undefined;
      }

      return await xnode.process.logs({
        session,
        container,
        process,
        query: { max: null, level: null },
      });
    },
    refetchInterval: logsRefetchInterval,
  });
}

export function useDirectory({
  session,
  container,
  path,
}: {
  session?: xnode.utils.Session;
  container?: string;
  path?: string;
}) {
  return useQuery({
    queryKey: ["directory", container, path, session?.baseUrl ?? ""],
    enabled: !!session && !!container && !!path,
    queryFn: async () => {
      if (!session || !container || !path) {
        return undefined;
      }

      return await xnode.file.read_directory({
        session,
        location: { container, path },
      });
    },
    refetchInterval: fileRefetchInterval,
  });
}

export function useFile({
  session,
  container,
  path,
}: {
  session?: xnode.utils.Session;
  container?: string;
  path?: string;
}) {
  return useQuery({
    queryKey: ["file", container, path, session?.baseUrl ?? ""],
    enabled: !!session && !!container && !!path,
    queryFn: async () => {
      if (!session || !container || !path) {
        return undefined;
      }

      return await xnode.file.read_file({
        session,
        location: { container, path },
      });
    },
    refetchInterval: fileRefetchInterval,
  });
}

export function useRequestInfo({
  session,
  request_id,
}: {
  session?: xnode.utils.Session;
  request_id?: number;
}) {
  return useQuery({
    queryKey: ["requestInfo", request_id ?? "", session?.baseUrl ?? ""],
    enabled: !!session && !!request_id,
    queryFn: async () => {
      if (!session || !request_id) {
        return undefined;
      }

      return await xnode.request.request_info({ session, request_id });
    },
    refetchInterval: requestInterval,
  });
}

export function useCommandInfo({
  session,
  request_id,
  command,
  queryArgs,
}: {
  session?: xnode.utils.Session;
  request_id?: number;
  command?: string;
  queryArgs?: QueryArgs;
}) {
  return useQuery({
    queryKey: [
      "requestInfo",
      request_id ?? "",
      command ?? "",
      session?.baseUrl ?? "",
    ],
    enabled:
      !!session && !!request_id && !!command && queryArgs?.enable !== false,
    queryFn: async () => {
      if (!session || !request_id || !command) {
        return undefined;
      }

      return await xnode.request.command_info({ session, request_id, command });
    },
    refetchInterval: requestInterval,
  });
}
