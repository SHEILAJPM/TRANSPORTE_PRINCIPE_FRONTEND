import { Badge } from "@/components/ui/badge";
import type { EstadoCotizacion } from "@/types/api";

const CONFIG: Record<EstadoCotizacion, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }> = {
  BORRADOR: { label: "Borrador", variant: "outline" },
  ENVIADA: { label: "Enviada", variant: "warning" },
  APROBADA: { label: "Aprobada", variant: "success" },
  RECHAZADA: { label: "Rechazada", variant: "destructive" },
  CONVERTIDA: { label: "Convertida a viaje", variant: "default" },
  VENCIDA: { label: "Vencida", variant: "secondary" },
};

export function EstadoCotizacionBadge({ estado }: { estado: EstadoCotizacion }) {
  const config = CONFIG[estado];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
