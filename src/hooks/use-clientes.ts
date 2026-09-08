import type { Cliente } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export function useClientes(q: string) {
  const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return useApiSWR<Cliente[]>(`/clientes${query}`, { keepPreviousData: true });
}
