import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { EstadoSunat, Factura, FacturaListItem, GuiaRemision, GuiaRemisionListItem } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export function useGuiaRemision(viajeId: string | null) {
  return useApiSWR<GuiaRemision>(viajeId ? `/viajes/${viajeId}/guia-remision` : null, {
    shouldRetryOnError: false,
  });
}

export interface FiltrosComprobantes {
  estado_sunat?: EstadoSunat;
  q?: string;
}

function construirQueryComprobantes(filtros?: FiltrosComprobantes) {
  if (!filtros) return "";
  const params = new URLSearchParams();
  if (filtros.estado_sunat) params.set("estado_sunat", filtros.estado_sunat);
  if (filtros.q) params.set("q", filtros.q);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useGuiasRemisionList(filtros?: FiltrosComprobantes) {
  return useApiSWR<GuiaRemisionListItem[]>(`/comprobantes/guias-remision${construirQueryComprobantes(filtros)}`);
}

export function useFacturasList(filtros?: FiltrosComprobantes) {
  return useApiSWR<FacturaListItem[]>(`/comprobantes/facturas${construirQueryComprobantes(filtros)}`);
}

export interface GuiaRemisionActualizarPayload {
  remitente_guia_ruc_emisor?: string | null;
  remitente_guia_serie?: string | null;
  remitente_guia_numero?: string | null;
}

export function useActualizarGuiaRemision(viajeId: string) {
  const [cargando, setCargando] = useState(false);

  async function actualizar(datos: GuiaRemisionActualizarPayload) {
    setCargando(true);
    try {
      const { data } = await api.patch<GuiaRemision>(`/viajes/${viajeId}/guia-remision`, datos);
      await mutate(`/viajes/${viajeId}/guia-remision`);
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo guardar la referencia de la guía remitente"));
    } finally {
      setCargando(false);
    }
  }

  return { actualizar, cargando };
}

export function useEmitirGuiaRemisionSunat(viajeId: string) {
  const [cargando, setCargando] = useState(false);

  async function emitir() {
    setCargando(true);
    try {
      const { data } = await api.post<GuiaRemision>(`/viajes/${viajeId}/guia-remision/emitir-sunat`);
      await mutate(`/viajes/${viajeId}/guia-remision`);
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo emitir la guía a SUNAT"));
    } finally {
      setCargando(false);
    }
  }

  return { emitir, cargando };
}

export function useFactura(viajeId: string | null) {
  return useApiSWR<Factura>(viajeId ? `/viajes/${viajeId}/factura` : null, { shouldRetryOnError: false });
}

export function useEmitirFacturaSunat(viajeId: string) {
  const [cargando, setCargando] = useState(false);

  async function emitir() {
    setCargando(true);
    try {
      const { data } = await api.post<Factura>(`/viajes/${viajeId}/factura/emitir-sunat`);
      await mutate(`/viajes/${viajeId}/factura`);
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo emitir la factura a SUNAT"));
    } finally {
      setCargando(false);
    }
  }

  return { emitir, cargando };
}

export function useAnularFactura(viajeId: string) {
  const [cargando, setCargando] = useState(false);

  async function anular(motivo?: string) {
    setCargando(true);
    try {
      const { data } = await api.post<Factura>(`/viajes/${viajeId}/factura/anular-sunat`, { motivo: motivo || null });
      await mutate(`/viajes/${viajeId}/factura`);
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo anular el comprobante"));
    } finally {
      setCargando(false);
    }
  }

  return { anular, cargando };
}

/**
 * Los endpoints de PDF requieren el Bearer token del usuario, así que no se pueden
 * abrir con un <a href> directo: se descargan vía axios (que sí manda el header) como
 * blob y se abren en una pestaña nueva.
 */
export async function abrirPdf(rutaRelativa: string) {
  try {
    const { data } = await api.get<Blob>(rutaRelativa, { responseType: "blob" });
    const blobUrl = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (err) {
    throw new Error(extraerMensajeError(err, "No se pudo generar el PDF"));
  }
}

export const rutaPdfCotizacion = (cotizacionId: string) => `/cotizaciones/${cotizacionId}/pdf`;
export const rutaPdfGuiaRemision = (viajeId: string) => `/viajes/${viajeId}/guia-remision/pdf`;
export const rutaPdfFactura = (viajeId: string) => `/viajes/${viajeId}/factura/pdf`;
export const rutaPdfConstancia = (constanciaId: string) => `/pesos-medidas/${constanciaId}/pdf`;
