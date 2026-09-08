import { useState } from "react";
import { mutate } from "swr";

import { api, extraerMensajeError } from "@/lib/api";
import type { Empresa } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export function useEmpresa() {
  return useApiSWR<Empresa>("/empresa");
}

export interface EmpresaUpdatePayload {
  razon_social?: string;
  nombre_comercial?: string | null;
  direccion_fiscal?: string | null;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  telefono?: string | null;
  email?: string | null;
  serie_factura_default?: string | null;
  serie_guia_remision_default?: string | null;
  numero_registro_mtc?: string | null;
}

export function useEmpresaActions() {
  const [cargando, setCargando] = useState(false);

  async function actualizar(payload: EmpresaUpdatePayload) {
    setCargando(true);
    try {
      const { data } = await api.patch<Empresa>("/empresa", payload);
      await mutate("/empresa");
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo actualizar la empresa"));
    } finally {
      setCargando(false);
    }
  }

  async function subirLogo(archivo: File) {
    setCargando(true);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const { data } = await api.post<Empresa>("/empresa/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await mutate("/empresa");
      return data;
    } catch (err) {
      throw new Error(extraerMensajeError(err, "No se pudo subir el logotipo"));
    } finally {
      setCargando(false);
    }
  }

  return { actualizar, subirLogo, cargando };
}
