import useSWR, { type SWRConfiguration } from "swr";

import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function useApiSWR<T>(path: string | null, config?: SWRConfiguration) {
  const token = useAuthStore((s) => s.token);
  return useSWR<T>(token && path ? path : null, fetcher, config);
}
