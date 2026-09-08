import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { ConstanciaPesosMedidas } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export function useConstanciaPorViaje(viajeId: string | null) {
  return useApiSWR<ConstanciaPesosMedidas>(viajeId ? `/pesos-medidas/por-viaje/${viajeId}` : null);
}

export interface ConstanciaListItem {
  id: string;
  numero: string;
  viaje_id: string;
  fecha_verificacion: string;
  tracto_placa: string;
  carreta_placa: string | null;
  chofer_nombre: string;
  generador_carga: string;
  guia_remision_numero: string;
  peso_bruto_kg: number;
  peso_neto_kg: number;
  peso_bruto_max_kg: number;
  excede_limite: boolean;
}

export function useConstancias(q: string) {
  const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return useApiSWR<ConstanciaListItem[]>(`/pesos-medidas${query}`, { keepPreviousData: true });
}

export interface ConstanciaUpdatePayload {
  peso_bruto_kg?: number;
  tara_kg?: number;
  precinto_seguridad?: string | null;
  lugar_verificacion?: string | null;
  observaciones?: string | null;
}

export function usePesosMedidasActions(viajeId: string) {
  const [cargando, setCargando] = useState(false);

  async function actualizar(constanciaId: string, payload: ConstanciaUpdatePayload) {
    setCargando(true);
    try {
      const { data } = await api.patch<ConstanciaPesosMedidas>(`/pesos-medidas/${constanciaId}`, payload);
      await mutate(`/pesos-medidas/por-viaje/${viajeId}`);
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo actualizar la constancia"));
    } finally {
      setCargando(false);
    }
  }

  return { actualizar, cargando };
}
