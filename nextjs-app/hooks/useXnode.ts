import { useSettings, Xnode } from "@/components/context/settings";
import {
  commandInfo,
  cpuUsage,
  diskUsage,
  getContainerConfig,
  getContainers,
  getDirectory,
  getFile,
  getLogs,
  getOS,
  getProcesses,
  login,
  memoryUsage,
  requestInfo,
  Session,
} from "@/lib/xnode";
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
  xnode,
  queryArgs,
}: {
  xnode?: Xnode;
  queryArgs?: QueryArgs;
}) {
  const { wallets } = useSettings();
  return useQuery({
    queryKey: ["session", xnode?.domain ?? "", xnode?.insecure ?? false],
    enabled: !!xnode && queryArgs?.enable !== false,
    queryFn: async () => {
      if (!xnode) {
        return undefined;
      }

      const session = await login({
        domain: xnode.domain,
        insecure: xnode.insecure,
        sig: wallets[xnode.owner],
      });
      return session;
    },
  });
}

export function useCpu({ session }: { session?: Session }) {
  return useQuery({
    queryKey: ["cpu", session?.baseUrl ?? ""],
    enabled: !!session,
    queryFn: async () => {
      if (!session) {
        return undefined;
      }

      return await cpuUsage({ session });
    },
    refetchInterval: usageRefetchInterval,
  });
}

export function useMemory({ session }: { session?: Session }) {
  return useQuery({
    queryKey: ["memory", session?.baseUrl ?? ""],
    enabled: !!session,
    queryFn: async () => {
      if (!session) {
        return undefined;
      }

      return await memoryUsage({ session });
    },
    refetchInterval: usageRefetchInterval,
  });
}

export function useDisk({ session }: { session?: Session }) {
  return useQuery({
    queryKey: ["disk", session?.baseUrl ?? ""],
    enabled: !!session,
    queryFn: async () => {
      if (!session) {
        return undefined;
      }

      return await diskUsage({ session });
    },
    refetchInterval: usageRefetchInterval,
  });
}

export function useOS({ session }: { session?: Session }) {
  return useQuery({
    queryKey: ["OS", session?.baseUrl ?? ""],
    enabled: !!session,
    queryFn: async () => {
      if (!session) {
        return undefined;
      }

      return await getOS({ session });
    },
    refetchInterval: OSRefetchInterval,
  });
}

export function useContainers({ session }: { session?: Session }) {
  return useQuery({
    queryKey: ["containers", session?.baseUrl ?? ""],
    enabled: !!session,
    queryFn: async () => {
      if (!session) {
        return undefined;
      }

      return await getContainers({ session });
    },
    refetchInterval: containersRefetchInterval,
  });
}

export function useContainerConfig({
  session,
  containerId,
}: {
  session?: Session;
  containerId?: string;
}) {
  return useQuery({
    queryKey: ["container", containerId, session?.baseUrl ?? ""],
    enabled: !!session && !!containerId,
    queryFn: async () => {
      if (!session || !containerId) {
        return undefined;
      }

      return await getContainerConfig({ session, containerId });
    },
    refetchInterval: containersRefetchInterval,
  });
}

export function useProcesses({
  session,
  containerId,
}: {
  session?: Session;
  containerId?: string;
}) {
  return useQuery({
    queryKey: ["processes", containerId, session?.baseUrl ?? ""],
    enabled: !!session && !!containerId,
    queryFn: async () => {
      if (!session || !containerId) {
        return undefined;
      }

      return await getProcesses({ session, containerId });
    },
    refetchInterval: processesRefetchInterval,
  });
}

export function useLogs({
  session,
  containerId,
  process,
}: {
  session?: Session;
  containerId?: string;
  process?: string;
}) {
  return useQuery({
    queryKey: ["logs", containerId, process, session?.baseUrl ?? ""],
    enabled: !!session && !!containerId && !!process,
    queryFn: async () => {
      if (!session || !containerId || !process) {
        return undefined;
      }

      return await getLogs({ session, containerId, process });
    },
    refetchInterval: logsRefetchInterval,
  });
}

export function useDirectory({
  session,
  containerId,
  path,
}: {
  session?: Session;
  containerId?: string;
  path?: string;
}) {
  return useQuery({
    queryKey: ["directory", containerId, path, session?.baseUrl ?? ""],
    enabled: !!session && !!containerId && !!path,
    queryFn: async () => {
      if (!session || !containerId || !path) {
        return undefined;
      }

      return await getDirectory({ session, location: { containerId, path } });
    },
    refetchInterval: fileRefetchInterval,
  });
}

export function useFile({
  session,
  containerId,
  path,
}: {
  session?: Session;
  containerId?: string;
  path?: string;
}) {
  return useQuery({
    queryKey: ["file", containerId, path, session?.baseUrl ?? ""],
    enabled: !!session && !!containerId && !!path,
    queryFn: async () => {
      if (!session || !containerId || !path) {
        return undefined;
      }

      return await getFile({ session, location: { containerId, path } });
    },
    refetchInterval: fileRefetchInterval,
  });
}

export function useRequestInfo({
  session,
  request_id,
}: {
  session?: Session;
  request_id?: number;
}) {
  return useQuery({
    queryKey: ["requestInfo", request_id ?? "", session?.baseUrl ?? ""],
    enabled: !!session && !!request_id,
    queryFn: async () => {
      if (!session || !request_id) {
        return undefined;
      }

      return await requestInfo({ session, request_id: request_id });
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
  session?: Session;
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

      return await commandInfo({ session, request_id: request_id, command });
    },
    refetchInterval: requestInterval,
  });
}
