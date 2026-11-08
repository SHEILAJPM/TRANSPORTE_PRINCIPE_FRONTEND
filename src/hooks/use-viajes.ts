import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type {
  BienGuia,
  EstadoViaje,
  GuiaRemitenteImportada,
  ModalidadViaje,
  ResultadoActivacion,
  Viaje,
} from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export interface ActivarViajePayload {
  cliente_id: string;
  /** Si se omite, el backend la deduce del documento del cliente (RUC/DNI). */
  modalidad?: ModalidadViaje;
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
  /** Opcional: el comprobante de venta se emite al terminar el viaje. */
  ingreso_flete_neto?: number | null;
  fecha_salida_programada: string;
  tarifa_diaria_chofer?: number | null;
  bono_nocturno_chofer?: number | null;
  precinto_seguridad?: string | null;
  lugar_verificacion_pesos?: string | null;
  numero_bultos?: number | null;
  motivo_traslado?: string | null;
  destinatario_tipo_documento?: string | null;
  destinatario_numero_documento?: string | null;
  destinatario_razon_social?: string | null;
  remitente_guia_ruc_emisor?: string | null;
  remitente_guia_serie?: string | null;
  remitente_guia_numero?: string | null;
  bienes?: BienGuia[] | null;
}

/** Lee el XML de la guía de remitente del cliente y devuelve el viaje prellenado. */
export async function importarGuiaRemitente(archivo: File): Promise<GuiaRemitenteImportada> {
  const formData = new FormData();
  formData.append("archivo", archivo);
  try {
    const { data } = await api.post<GuiaRemitenteImportada>("/sunat/guia-remitente/importar", formData);
    return data;
  } catch (err) {
    throw new Error(extraerMensajeError(err, "No se pudo leer la guía del cliente"));
  }
}

/** Lee el "Detalle de GRE" copiado desde SUNAT SOL y devuelve el viaje prellenado. */
export async function leerGuiaRemitenteTexto(texto: string): Promise<GuiaRemitenteImportada> {
  try {
    const { data } = await api.post<GuiaRemitenteImportada>("/sunat/guia-remitente/texto", { texto });
    return data;
  } catch (err) {
    throw new Error(extraerMensajeError(err, "No se pudo leer el detalle de la guía"));
  }
}

/** Trae de SUNAT la guía de remitente del cliente con su RUC, serie y número. */
export async function consultarGuiaRemitente(ruc: string, serie: string, numero: string): Promise<GuiaRemitenteImportada> {
  try {
    const { data } = await api.post<GuiaRemitenteImportada>("/sunat/guia-remitente/consultar", { ruc, serie, numero });
    return data;
  } catch (err) {
    throw new Error(extraerMensajeError(err, "SUNAT no entregó la guía"));
  }
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
