import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EstadoVehiculo } from "@/types/api";

const CONFIG: Record<EstadoVehiculo, { label: string; variant: "success" | "warning" | "destructive" }> = {
  OPERATIVO: { label: "Operativo", variant: "success" },
  EN_MANTENIMIENTO: { label: "En mantenimiento", variant: "warning" },
  INHABILITADO: { label: "Inhabilitado", variant: "destructive" },
};

export function EstadoVehiculoBadge({ estado }: { estado: EstadoVehiculo }) {
  const config = CONFIG[estado];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function VencimientoBadge({ fecha }: { fecha: string | null }) {
  if (!fecha) return <span className="text-xs text-muted-foreground">Sin registrar</span>;
  const dias = Math.floor((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const vencido = dias < 0;
  const porVencer = dias >= 0 && dias <= 30;
  return (
    <span
      className={cn(
        "text-xs font-medium",
        vencido ? "text-destructive" : porVencer ? "text-warning" : "text-muted-foreground"
      )}
    >
      {new Date(fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
      {vencido && " · Vencido"}
      {porVencer && ` · ${dias} d.`}
    </span>
  );
}
