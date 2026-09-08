import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { NovedadViaje } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export interface NovedadViajeCreatePayload {
  tipo_novedad: string;
  descripcion: string;
  fecha: string;
  latitud?: number | null;
  longitud?: number | null;
  foto_url?: string | null;
  uuid_dispositivo?: string | null;
}

export function useNovedades(viajeId: string | null) {
  return useApiSWR<NovedadViaje[]>(viajeId ? `/viajes/${viajeId}/novedades` : null);
}

export function useNovedadActions(viajeId: string) {
  const [cargando, setCargando] = useState(false);

  async function reportar(payload: NovedadViajeCreatePayload) {
    setCargando(true);
    try {
      const { data } = await api.post<NovedadViaje>(`/viajes/${viajeId}/novedades`, payload);
      await mutate(`/viajes/${viajeId}/novedades`);
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo reportar la novedad"));
    } finally {
      setCargando(false);
    }
  }

  return { reportar, cargando };
}
