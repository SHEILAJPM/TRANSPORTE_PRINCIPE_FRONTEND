import { Badge } from "@/components/ui/badge";
import type { EstadoViaje } from "@/types/api";

const CONFIG: Record<EstadoViaje, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }> = {
  PROGRAMADO: { label: "Programado", variant: "outline" },
  EN_RUTA: { label: "En ruta", variant: "warning" },
  FINALIZADO: { label: "Finalizado", variant: "success" },
  LIQUIDADO: { label: "Liquidado", variant: "default" },
  CANCELADO: { label: "Cancelado", variant: "destructive" },
};

export function EstadoViajeBadge({ estado }: { estado: EstadoViaje }) {
  const config = CONFIG[estado];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
