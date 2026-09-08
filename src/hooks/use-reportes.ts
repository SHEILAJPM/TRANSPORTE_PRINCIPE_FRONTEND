import type { EstadoViaje, ResumenFinanciero } from "@/types/api";

import { useApiSWR } from "./use-swr-api";

export interface ViajeRentabilidadItem {
  id: string;
  numero: string;
  estado: EstadoViaje;
  fecha_salida_programada: string;
  cliente_razon_social: string;
  placa_tracto: string;
  placa_carreta: string | null;
  origen: string;
  destino: string;
  ingresos_netos_flete: number;
  total_gastos_operativos: number;
  monto_dietas_chofer: number;
  egresos_totales: number;
  ganancia_neta: number;
}

export interface FiltrosReportes {
  cliente_id?: string;
  placa?: string;
  ciudad?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export function useReporteViajes(filtros: FiltrosReportes) {
  const params = new URLSearchParams();
  if (filtros.cliente_id) params.set("cliente_id", filtros.cliente_id);
  if (filtros.placa) params.set("placa", filtros.placa);
  if (filtros.ciudad) params.set("ciudad", filtros.ciudad);
  if (filtros.fecha_desde) params.set("fecha_desde", filtros.fecha_desde);
  if (filtros.fecha_hasta) params.set("fecha_hasta", filtros.fecha_hasta);
  const query = params.toString();
  return useApiSWR<ViajeRentabilidadItem[]>(`/reportes/viajes${query ? `?${query}` : ""}`);
}

export function useResumenFinanciero(fechaDesde?: string, fechaHasta?: string) {
  const params = new URLSearchParams();
  if (fechaDesde) params.set("fecha_desde", fechaDesde);
  if (fechaHasta) params.set("fecha_hasta", fechaHasta);
  const query = params.toString();
  return useApiSWR<ResumenFinanciero>(`/reportes/resumen-financiero${query ? `?${query}` : ""}`);
}
