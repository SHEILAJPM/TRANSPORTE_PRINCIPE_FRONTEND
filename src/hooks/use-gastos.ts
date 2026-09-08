import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { GastoViaje, TipoGastoViaje } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export interface GastoViajeCreatePayload {
  tipo_gasto: TipoGastoViaje;
  monto: number;
  fecha: string;
  galones?: number | null;
  grifo_nombre?: string | null;
  numero_ticket?: string | null;
  descripcion?: string | null;
  comprobante_url?: string | null;
  uuid_dispositivo?: string | null;
}

export function useGastos(viajeId: string | null) {
  return useApiSWR<GastoViaje[]>(viajeId ? `/viajes/${viajeId}/gastos` : null);
}

export function useGastoActions(viajeId: string) {
  const [cargando, setCargando] = useState(false);

  async function registrar(payload: GastoViajeCreatePayload) {
    setCargando(true);
    try {
      const { data } = await api.post<GastoViaje>(`/viajes/${viajeId}/gastos`, payload);
      await mutate(`/viajes/${viajeId}/gastos`);
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo registrar el gasto"));
    } finally {
      setCargando(false);
    }
  }

  return { registrar, cargando };
}
