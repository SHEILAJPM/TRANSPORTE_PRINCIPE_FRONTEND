import { useApiSWR } from "./use-swr-api";

export interface AlertaVencimiento {
  entidad_tipo: string;
  entidad_id: string;
  identificador: string;
  concepto: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  vencido: boolean;
}

export function useAlertasVencimiento() {
  return useApiSWR<AlertaVencimiento[]>("/flota/alertas-vencimiento");
}
