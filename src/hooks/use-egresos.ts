import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { CategoriaGastoGeneral, GastoGeneral } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export interface FiltrosEgresos {
  categoria?: CategoriaGastoGeneral;
  fecha_desde?: string;
  fecha_hasta?: string;
}

function construirQuery(filtros?: FiltrosEgresos) {
  if (!filtros) return "";
  const params = new URLSearchParams();
  if (filtros.categoria) params.set("categoria", filtros.categoria);
  if (filtros.fecha_desde) params.set("fecha_desde", filtros.fecha_desde);
  if (filtros.fecha_hasta) params.set("fecha_hasta", filtros.fecha_hasta);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useEgresosGenerales(filtros?: FiltrosEgresos) {
  return useApiSWR<GastoGeneral[]>(`/egresos-generales${construirQuery(filtros)}`);
}

export interface EgresoGeneralPayload {
  categoria: CategoriaGastoGeneral;
  descripcion: string;
  monto: number;
  fecha: string;
  proveedor?: string | null;
  comprobante_url?: string | null;
}

async function revalidarEgresos() {
  await mutate((key) => typeof key === "string" && (key.startsWith("/egresos-generales") || key.startsWith("/reportes/resumen-financiero")));
}

export function useEgresoActions() {
  const [cargando, setCargando] = useState(false);

  async function crear(payload: EgresoGeneralPayload) {
    setCargando(true);
    try {
      const { data } = await api.post<GastoGeneral>("/egresos-generales", payload);
      await revalidarEgresos();
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo registrar el egreso"));
    } finally {
      setCargando(false);
    }
  }

  async function eliminar(id: string) {
    setCargando(true);
    try {
      await api.delete(`/egresos-generales/${id}`);
      await revalidarEgresos();
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo eliminar el egreso"));
    } finally {
      setCargando(false);
    }
  }

  return { crear, eliminar, cargando };
}
