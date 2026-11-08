import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { Cliente, TipoDocumentoIdentidad } from "@/types/api";

export function useSunatAutocompletarCliente() {
  const [cargando, setCargando] = useState(false);

  async function autocompletar(tipoDocumento: TipoDocumentoIdentidad, numeroDocumento: string) {
    setCargando(true);
    try {
      const { data } = await api.post<Cliente>(`/sunat/clientes/autocompletar/${tipoDocumento}/${numeroDocumento}`);
      await mutate((key) => typeof key === "string" && key.startsWith("/clientes"));
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo consultar el RUC/DNI"));
    } finally {
      setCargando(false);
    }
  }

  return { autocompletar, cargando };
}

export interface DniConsulta {
  numero_documento: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
}

/** Nombres y apellidos por DNI desde RENIEC (vía Decolecta). Cada consulta se cobra. */
export function useConsultaDni() {
  const [cargando, setCargando] = useState(false);

  async function consultar(dni: string) {
    setCargando(true);
    try {
      const { data } = await api.get<DniConsulta>(`/sunat/dni/${dni}`);
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo consultar el DNI en RENIEC"));
    } finally {
      setCargando(false);
    }
  }

  return { consultar, cargando };
}
