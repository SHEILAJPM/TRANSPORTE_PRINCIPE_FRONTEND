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
