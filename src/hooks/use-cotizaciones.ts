import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { Cotizacion, EstadoCotizacion, ResultadoConversion } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export interface CotizacionCreatePayload {
  cliente_id: string;
  descripcion_servicio: string;
  origen_direccion: string;
  origen_distrito: string;
  origen_provincia: string;
  origen_departamento: string;
  destino_direccion: string;
  destino_distrito: string;
  destino_provincia: string;
  destino_departamento: string;
  cantidad_camiones: number;
  peso_tm: number;
  precio_base: number;
  porcentaje_igv: number;
  condiciones_comerciales: string;
  validez_dias: number;
}

export interface AsignacionUnidadPayload {
  tracto_id: string;
  chofer_id: string;
  fecha_salida_programada: string;
  carreta_id?: string | null;
  precinto_seguridad?: string | null;
  lugar_verificacion_pesos?: string | null;
  origen_ubigeo?: string | null;
  destino_ubigeo?: string | null;
}

export function useCotizaciones(filtros?: { estado?: EstadoCotizacion }) {
  const params = filtros?.estado ? `?estado=${filtros.estado}` : "";
  return useApiSWR<Cotizacion[]>(`/cotizaciones${params}`);
}

export function useCotizacion(id: string | null) {
  return useApiSWR<Cotizacion>(id ? `/cotizaciones/${id}` : null);
}

export function useCotizacionActions() {
  const [cargando, setCargando] = useState(false);

  async function crear(payload: CotizacionCreatePayload) {
    setCargando(true);
    try {
      const { data } = await api.post<Cotizacion>("/cotizaciones", payload);
      await mutate((key) => typeof key === "string" && key.startsWith("/cotizaciones"));
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo crear la cotización"));
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(id: string, estado: EstadoCotizacion) {
    setCargando(true);
    try {
      const { data } = await api.patch<Cotizacion>(`/cotizaciones/${id}/estado`, { estado });
      await mutate((key) => typeof key === "string" && key.startsWith("/cotizaciones"));
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo cambiar el estado de la cotización"));
    } finally {
      setCargando(false);
    }
  }

  async function convertirAViaje(
    id: string,
    modalidad: "CON_RUC" | "SIN_RUC",
    asignaciones: AsignacionUnidadPayload[]
  ) {
    setCargando(true);
    try {
      const { data } = await api.post<ResultadoConversion[]>(`/cotizaciones/${id}/convertir-a-viaje`, {
        modalidad,
        asignaciones,
      });
      await mutate((key) => typeof key === "string" && key.startsWith("/cotizaciones"));
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo convertir la cotización a viaje"));
    } finally {
      setCargando(false);
    }
  }

  return { crear, cambiarEstado, convertirAViaje, cargando };
}
