import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { EstadoViaje, ModalidadViaje, ResultadoActivacion, Viaje } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export interface ActivarViajePayload {
  cliente_id: string;
  modalidad: ModalidadViaje;
  tracto_id: string;
  chofer_id: string;
  carreta_id?: string | null;
  origen_direccion: string;
  origen_distrito: string;
  origen_provincia: string;
  origen_departamento: string;
  origen_ubigeo?: string | null;
  destino_direccion: string;
  destino_distrito: string;
  destino_provincia: string;
  destino_departamento: string;
  destino_ubigeo?: string | null;
  peso_tm: number;
  ingreso_flete_neto: number;
  fecha_salida_programada: string;
  tarifa_diaria_chofer?: number | null;
  bono_nocturno_chofer?: number | null;
  precinto_seguridad?: string | null;
  lugar_verificacion_pesos?: string | null;
  porcentaje_igv?: number;
}

export interface FiltrosViajes {
  estado?: EstadoViaje;
  chofer_id?: string;
  tracto_id?: string;
  cotizacion_id?: string;
}

function construirQuery(filtros?: FiltrosViajes) {
  if (!filtros) return "";
  const params = new URLSearchParams();
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.chofer_id) params.set("chofer_id", filtros.chofer_id);
  if (filtros.tracto_id) params.set("tracto_id", filtros.tracto_id);
  if (filtros.cotizacion_id) params.set("cotizacion_id", filtros.cotizacion_id);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useViajes(filtros?: FiltrosViajes) {
  return useApiSWR<Viaje[]>(`/viajes${construirQuery(filtros)}`);
}

export function useViaje(id: string | null) {
  return useApiSWR<Viaje>(id ? `/viajes/${id}` : null);
}

export function useViajesPorCotizacion(cotizacionId: string | null) {
  return useApiSWR<Pick<Viaje, "id" | "numero" | "estado">[]>(
    cotizacionId ? `/viajes?cotizacion_id=${cotizacionId}` : null
  );
}

async function revalidarViajes() {
  await mutate((key) => typeof key === "string" && key.startsWith("/viajes"));
}

export function useViajeActions() {
  const [cargando, setCargando] = useState(false);

  async function activar(payload: ActivarViajePayload) {
    setCargando(true);
    try {
      const { data } = await api.post<ResultadoActivacion>("/viajes/activar", payload);
      await revalidarViajes();
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo activar el viaje"));
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(
    id: string,
    estado: EstadoViaje,
    extra?: { fecha_salida_real?: string; fecha_llegada_real?: string; observaciones?: string }
  ) {
    setCargando(true);
    try {
      const { data } = await api.patch<Viaje>(`/viajes/${id}/estado`, { estado, ...extra });
      await revalidarViajes();
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo actualizar el estado del viaje"));
    } finally {
      setCargando(false);
    }
  }

  return { activar, cambiarEstado, cargando };
}
