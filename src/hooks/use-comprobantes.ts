import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type {
  ComprobanteBorrador,
  ComprobanteVistaPrevia,
  DepositanteDetraccion,
  EntradaComprobante,
  EstadoConexionSunat,
  EstadoSunat,
  Factura,
  FacturaListItem,
  GuiaRemision,
  GuiaRemisionListItem,
  GuiaVistaPrevia,
  PruebaConexionSunat,
  TotalesFacturacion,
  ViajeFacturable,
} from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export function useGuiaRemision(viajeId: string | null) {
  return useApiSWR<GuiaRemision>(viajeId ? `/viajes/${viajeId}/guia-remision` : null, {
    shouldRetryOnError: false,
  });
}

export interface FiltrosComprobantes {
  desde?: string;
  hasta?: string;
  cliente_id?: string;
  placa?: string;
  chofer_id?: string;
  estado_sunat?: EstadoSunat;
  tipo_documento?: "FACTURA" | "BOLETA" | "NOTA_CREDITO";
  detraccion?: "PENDIENTE" | "DEPOSITADA";
  q?: string;
}

function construirQueryComprobantes(filtros?: FiltrosComprobantes) {
  if (!filtros) return "";
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor) params.set(clave, String(valor));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useGuiasRemisionList(filtros?: FiltrosComprobantes) {
  return useApiSWR<GuiaRemisionListItem[]>(`/comprobantes/guias-remision${construirQueryComprobantes(filtros)}`);
}

export function useFacturasList(filtros?: FiltrosComprobantes) {
  return useApiSWR<FacturaListItem[]>(`/comprobantes/facturas${construirQueryComprobantes(filtros)}`);
}

export function useFacturasTotales(filtros?: FiltrosComprobantes) {
  return useApiSWR<TotalesFacturacion>(`/comprobantes/facturas/totales${construirQueryComprobantes(filtros)}`);
}

/** Viajes para "Nueva factura": terminados o con la guía aceptada, sin comprobante vigente. */
export function useFacturables(activo: boolean) {
  return useApiSWR<ViajeFacturable[]>(activo ? "/comprobantes/facturables" : null);
}

export interface DepositoDetraccionPayload {
  depositada_por: DepositanteDetraccion;
  fecha_deposito: string;
  numero_constancia: string;
  monto?: number | null;
}

/** Registra (o deshace) la constancia de depósito de la detracción de un comprobante. */
export function useDepositoDetraccion() {
  const [cargando, setCargando] = useState(false);

  async function ejecutar(fn: () => Promise<unknown>, fallback: string) {
    setCargando(true);
    try {
      await fn();
      await mutate((clave) => typeof clave === "string" && clave.startsWith("/comprobantes"));
    } catch (err) {
      throw new Error(extraerMensajeError(err, fallback));
    } finally {
      setCargando(false);
    }
  }

  const registrar = (facturaId: string, payload: DepositoDetraccionPayload) =>
    ejecutar(() => api.put(`/comprobantes/facturas/${facturaId}/detraccion`, payload), "No se pudo registrar el depósito");
  const quitar = (facturaId: string) =>
    ejecutar(() => api.delete(`/comprobantes/facturas/${facturaId}/detraccion`), "No se pudo quitar el registro");

  return { registrar, quitar, cargando };
}

export function useConexionSunat() {
  const respuesta = useApiSWR<EstadoConexionSunat>("/sunat/certificado/estado", { shouldRetryOnError: false });
  const [probando, setProbando] = useState(false);

  /** Solo pide un token a SUNAT con las credenciales configuradas: no envía documentos. */
  async function probar() {
    setProbando(true);
    try {
      const { data } = await api.post<PruebaConexionSunat>("/sunat/conexion/probar");
      await respuesta.mutate();
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo probar la conexión con SUNAT"));
    } finally {
      setProbando(false);
    }
  }

  return { ...respuesta, probar, probando };
}

export interface GuiaRemisionActualizarPayload {
  remitente_guia_ruc_emisor?: string | null;
  remitente_guia_serie?: string | null;
  remitente_guia_numero?: string | null;
  destinatario_tipo_documento?: string | null;
  destinatario_numero_documento?: string | null;
  destinatario_razon_social?: string | null;
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

/**
 * SUNAT no tiene entorno de pruebas para la guía: siempre se pide primero la vista
 * previa, y el envío lleva su `huella` (si los datos cambiaron, el backend no envía).
 */
export function useGuiaRemisionSunat(viajeId: string) {
  const [cargando, setCargando] = useState<"vista-previa" | "emitir" | "consultar" | null>(null);

  async function ejecutar<T>(accion: NonNullable<typeof cargando>, fn: () => Promise<T>, fallback: string) {
    setCargando(accion);
    try {
      return await fn();
    } catch (err) {
      throw new Error(extraerMensajeError(err, fallback));
    } finally {
      setCargando(null);
    }
  }

  const previsualizar = () =>
    ejecutar(
      "vista-previa",
      async () => (await api.post<GuiaVistaPrevia>(`/viajes/${viajeId}/guia-remision/vista-previa`)).data,
      "No se pudo preparar la vista previa de la guía"
    );

  const emitir = (huella: string) =>
    ejecutar(
      "emitir",
      async () => {
        const { data } = await api.post<GuiaRemision>(`/viajes/${viajeId}/guia-remision/emitir-sunat`, {
          huella_vista_previa: huella,
        });
        await mutate(`/viajes/${viajeId}/guia-remision`);
        return data;
      },
      "No se pudo emitir la guía a SUNAT"
    );

  const consultar = () =>
    ejecutar(
      "consultar",
      async () => {
        const { data } = await api.post<GuiaRemision>(`/viajes/${viajeId}/guia-remision/consultar-sunat`);
        await mutate(`/viajes/${viajeId}/guia-remision`);
        return data;
      },
      "No se pudo consultar el estado en SUNAT"
    );

  return { previsualizar, emitir, consultar, cargando };
}

/** Descarga un archivo protegido (XML firmado, CDR) con el Bearer token del usuario. */
export async function descargarArchivo(rutaRelativa: string, nombreSugerido: string) {
  try {
    const { data, headers } = await api.get<Blob>(rutaRelativa, { responseType: "blob" });
    const disposicion = String(headers["content-disposition"] ?? "");
    const nombre = /filename="([^"]+)"/.exec(disposicion)?.[1] ?? nombreSugerido;
    const blobUrl = URL.createObjectURL(data);
    const enlace = document.createElement("a");
    enlace.href = blobUrl;
    enlace.download = nombre;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (err) {
    throw new Error(extraerMensajeError(err, "No se pudo descargar el archivo"));
  }
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

/**
 * Factura/Boleta al terminar el viaje: borrador sugerido -> vista previa (calcula IGV,
 * no numera nada) -> emitir con la huella de esa vista previa.
 */
export function useComprobanteViaje(viajeId: string) {
  const [cargando, setCargando] = useState<"borrador" | "vista-previa" | "emitir" | null>(null);

  async function ejecutar<T>(accion: NonNullable<typeof cargando>, fn: () => Promise<T>, fallback: string) {
    setCargando(accion);
    try {
      return await fn();
    } catch (err) {
      throw new Error(extraerMensajeError(err, fallback));
    } finally {
      setCargando(null);
    }
  }

  const obtenerBorrador = () =>
    ejecutar(
      "borrador",
      async () => (await api.get<ComprobanteBorrador>(`/viajes/${viajeId}/comprobante/borrador`)).data,
      "No se pudieron cargar los datos del comprobante"
    );

  const previsualizar = (entrada: EntradaComprobante) =>
    ejecutar(
      "vista-previa",
      async () => (await api.post<ComprobanteVistaPrevia>(`/viajes/${viajeId}/comprobante/vista-previa`, entrada)).data,
      "No se pudo preparar la vista previa del comprobante"
    );

  const emitir = (entrada: EntradaComprobante, huella: string) =>
    ejecutar(
      "emitir",
      async () => {
        try {
          return (
            await api.post<Factura>(`/viajes/${viajeId}/comprobante/emitir`, { ...entrada, huella_vista_previa: huella })
          ).data;
        } finally {
          // Aun si el envío a SUNAT falló, el comprobante pudo quedar registrado.
          await mutate(`/viajes/${viajeId}/factura`);
          await mutate((key) => typeof key === "string" && key.startsWith("/viajes"));
        }
      },
      "No se pudo emitir el comprobante"
    );

  return { obtenerBorrador, previsualizar, emitir, cargando };
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
export const rutaXmlGuiaRemision = (viajeId: string) => `/viajes/${viajeId}/guia-remision/xml`;
export const rutaCdrGuiaRemision = (viajeId: string) => `/viajes/${viajeId}/guia-remision/cdr`;
export const rutaPdfFactura = (viajeId: string) => `/viajes/${viajeId}/factura/pdf`;
export const rutaPdfConstancia = (constanciaId: string) => `/pesos-medidas/${constanciaId}/pdf`;
