import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { Chofer } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export function useChoferes(soloActivos = true) {
  return useApiSWR<Chofer[]>(`/choferes?solo_activos=${soloActivos}`);
}

export interface ChoferCreatePayload {
  dni: string;
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  direccion?: string | null;
  licencia_numero: string;
  licencia_categoria?: string;
  licencia_vencimiento: string;
  examen_medico_fecha?: string | null;
  examen_medico_vencimiento?: string | null;
  fecha_ingreso?: string | null;
  tarifa_diaria_default: number;
  bono_nocturno_default: number;
}

export type ChoferUpdatePayload = Partial<Omit<ChoferCreatePayload, "dni">> & { activo?: boolean };

export function useChoferActions() {
  const [cargando, setCargando] = useState(false);

  async function crear(payload: ChoferCreatePayload) {
    setCargando(true);
    try {
      const { data } = await api.post<Chofer>("/choferes", payload);
      await mutate((key) => typeof key === "string" && key.startsWith("/choferes"));
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo registrar el chofer"));
    } finally {
      setCargando(false);
    }
  }

  async function actualizar(id: string, payload: ChoferUpdatePayload) {
    setCargando(true);
    try {
      const { data } = await api.patch<Chofer>(`/choferes/${id}`, payload);
      await mutate((key) => typeof key === "string" && key.startsWith("/choferes"));
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo actualizar el chofer"));
    } finally {
      setCargando(false);
    }
  }

  return { crear, actualizar, cargando };
}
