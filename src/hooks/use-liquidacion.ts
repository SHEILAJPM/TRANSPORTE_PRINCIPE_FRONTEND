import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { Liquidacion, Rentabilidad } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export function useRentabilidad(viajeId: string | null) {
  return useApiSWR<Rentabilidad>(viajeId ? `/viajes/${viajeId}/rentabilidad` : null);
}

export function useLiquidacionActions(viajeId: string) {
  const [cargando, setCargando] = useState(false);

  async function calcular() {
    setCargando(true);
    try {
      const { data } = await api.post<Liquidacion>(`/viajes/${viajeId}/liquidacion/calcular`);
      await mutate(`/viajes/${viajeId}/rentabilidad`);
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo calcular la liquidación"));
    } finally {
      setCargando(false);
    }
  }

  return { calcular, cargando };
}
