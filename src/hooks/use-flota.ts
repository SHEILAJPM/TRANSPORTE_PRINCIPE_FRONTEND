import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { Carreta, EstadoVehiculo, Tracto, TipoCarreta, TipoMantenimiento } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export function useTractos() {
  return useApiSWR<Tracto[]>("/flota/tractos");
}

export function useCarretas() {
  return useApiSWR<Carreta[]>("/flota/carretas");
}

export interface DimensionesVehicularesPayload {
  largo_m: number;
  ancho_m: number;
  alto_m: number;
  configuracion_vehicular: string;
  numero_ejes?: number | null;
  tara_kg?: number | null;
  peso_bruto_max_kg: number;
  kilometraje_actual?: number;
  soat_vencimiento?: string | null;
  citv_vencimiento?: string | null;
  mtc_habilitacion_vencimiento?: string | null;
  tarjeta_unica_circulacion?: string | null;
}

export interface TractoCreatePayload extends DimensionesVehicularesPayload {
  placa: string;
  marca: string;
  modelo?: string | null;
  anio_fabricacion?: number | null;
  numero_motor?: string | null;
  numero_chasis?: string | null;
}

export type TractoUpdatePayload = Partial<Omit<TractoCreatePayload, "placa">> & { estado?: EstadoVehiculo };

export interface CarretaCreatePayload extends DimensionesVehicularesPayload {
  placa: string;
  tipo_carreta: TipoCarreta;
  marca?: string | null;
  modelo?: string | null;
  anio_fabricacion?: number | null;
}

export type CarretaUpdatePayload = Partial<Omit<CarretaCreatePayload, "placa">> & { estado?: EstadoVehiculo };

export interface MantenimientoPayload {
  tipo_mantenimiento: TipoMantenimiento;
  descripcion: string;
  kilometraje_actual_registro: number;
  kilometraje_proximo?: number | null;
  fecha_realizado: string;
  costo?: number | null;
  proveedor?: string | null;
  completado?: boolean;
}

async function revalidarFlota() {
  await mutate((key) => typeof key === "string" && key.startsWith("/flota"));
}

export function useFlotaActions() {
  const [cargando, setCargando] = useState(false);

  async function crearTracto(payload: TractoCreatePayload) {
    setCargando(true);
    try {
      const { data } = await api.post<Tracto>("/flota/tractos", payload);
      await revalidarFlota();
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo registrar el tracto"));
    } finally {
      setCargando(false);
    }
  }

  async function actualizarTracto(id: string, payload: TractoUpdatePayload) {
    setCargando(true);
    try {
      const { data } = await api.patch<Tracto>(`/flota/tractos/${id}`, payload);
      await revalidarFlota();
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo actualizar el tracto"));
    } finally {
      setCargando(false);
    }
  }

  async function crearCarreta(payload: CarretaCreatePayload) {
    setCargando(true);
    try {
      const { data } = await api.post<Carreta>("/flota/carretas", payload);
      await revalidarFlota();
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo registrar la carreta"));
    } finally {
      setCargando(false);
    }
  }

  async function actualizarCarreta(id: string, payload: CarretaUpdatePayload) {
    setCargando(true);
    try {
      const { data } = await api.patch<Carreta>(`/flota/carretas/${id}`, payload);
      await revalidarFlota();
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo actualizar la carreta"));
    } finally {
      setCargando(false);
    }
  }

  async function registrarMantenimiento(tipo: "tractos" | "carretas", id: string, payload: MantenimientoPayload) {
    setCargando(true);
    try {
      const { data } = await api.post(`/flota/${tipo}/${id}/mantenimientos`, payload);
      await mutate(`/flota/${tipo}/${id}/mantenimientos`);
      await revalidarFlota();
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo registrar el mantenimiento"));
    } finally {
      setCargando(false);
    }
  }

  return { crearTracto, actualizarTracto, crearCarreta, actualizarCarreta, registrarMantenimiento, cargando };
}

export interface Mantenimiento {
  id: string;
  tracto_id: string | null;
  carreta_id: string | null;
  tipo_mantenimiento: TipoMantenimiento;
  descripcion: string;
  kilometraje_actual_registro: number;
  kilometraje_proximo: number | null;
  fecha_realizado: string;
  costo: number | null;
  proveedor: string | null;
  completado: boolean;
}

export function useMantenimientos(tipo: "tractos" | "carretas", id: string | null) {
  return useApiSWR<Mantenimiento[]>(id ? `/flota/${tipo}/${id}/mantenimientos` : null);
}
