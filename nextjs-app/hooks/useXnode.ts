import { useSettings, Xnode } from "@/components/context/settings";
import {
  cpuUsage,
  diskUsage,
  getContainerConfig,
  getContainers,
  getDirectory,
  getFile,
  getLogs,
  getProcesses,
  login,
  memoryUsage,
  Session,
} from "@/lib/xnode";
import { useQuery } from "@tanstack/react-query";

const usageRefetchInterval = 1000; // 1 sec
const containersRefetchInterval = 20_000; // 20 sec
const processesRefetchInterval = 20_000; // 20 sec
const fileRefetchInterval = 20_000; // 20 sec
const logsRefetchInterval = 1000; // 1 sec

export function useSession({ xnode }: { xnode?: Xnode }) {
  const { wallets } = useSettings();
  return useQuery({
    queryKey: ["session", xnode?.domain ?? "", xnode?.insecure ?? false],
    enabled: !!xnode,
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
    queryKey: ["containers", containerId, session?.baseUrl ?? ""],
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
