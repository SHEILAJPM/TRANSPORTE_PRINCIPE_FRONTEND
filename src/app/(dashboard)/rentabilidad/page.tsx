"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Fuel, Receipt, Trash2, Truck, Wrench, X } from "lucide-react";
import { toast } from "sonner";

import { CATEGORIAS, EgresoFormDialog } from "@/components/reportes/egreso-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useEgresoActions, useEgresosGenerales } from "@/hooks/use-egresos";
import { useResumenFinanciero } from "@/hooks/use-reportes";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export default function RentabilidadPage() {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const { data: resumen, isLoading } = useResumenFinanciero(fechaDesde || undefined, fechaHasta || undefined);
  const { data: egresos, isLoading: cargandoEgresos } = useEgresosGenerales({
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
  });
  const { eliminar } = useEgresoActions();

  async function onEliminar(id: string) {
    try {
      await eliminar(id);
      toast.success("Egreso eliminado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el egreso");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Rentabilidad</h2>
        <p className="text-sm text-muted-foreground">
          Consolidado financiero de toda la empresa: ingresos menos egresos totales de un período.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="rg_fecha_desde">Desde</Label>
            <Input id="rg_fecha_desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rg_fecha_hasta">Hasta</Label>
            <Input id="rg_fecha_hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </div>
          {(fechaDesde || fechaHasta) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFechaDesde("");
                setFechaHasta("");
              }}
            >
              <X className="h-3.5 w-3.5" /> Limpiar
            </Button>
          )}
          <p className="ml-auto text-xs text-muted-foreground">Sin fechas = histórico completo</p>
        </CardContent>
      </Card>

      {isLoading || !resumen ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Consolidado financiero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Fila label="Ingresos totales (fletes)" value={resumen.ingresos_totales} positivo />
              <Fila label="Gastos operativos de viaje" value={-resumen.egresos_operativos_viajes} icon={Fuel} />
              <Fila label="Dietas y nocturnidad de choferes" value={-resumen.dietas_choferes} icon={Receipt} />
              <Fila label="Mantenimiento de flota" value={-resumen.mantenimiento_flota} icon={Wrench} />
              <Fila label="Egresos generales de la empresa" value={-resumen.egresos_generales} icon={Truck} />
              <div className="border-t border-border pt-3">
                <Fila label="Ganancia neta" value={resumen.ganancia_neta} destacado />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Egresos generales</CardTitle>
          <EgresoFormDialog />
        </CardHeader>
        <CardContent className="space-y-2">
          {cargandoEgresos && <Skeleton className="h-24 w-full" />}
          {!cargandoEgresos && (egresos ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin egresos generales registrados en este período.
            </p>
          )}
          {egresos?.map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{CATEGORIAS.find((c) => c.value === g.categoria)?.label ?? g.categoria}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(g.fecha)}</span>
                </div>
                <p className="mt-1 truncate">{g.descripcion}</p>
                {g.proveedor && <p className="text-xs text-muted-foreground">{g.proveedor}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-semibold tabular-nums">{formatCurrency(g.monto)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onEliminar(g.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Fila({
  label,
  value,
  positivo,
  destacado,
  icon: Icon,
}: {
  label: string;
  value: number;
  positivo?: boolean;
  destacado?: boolean;
  icon?: typeof Fuel;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn("flex items-center gap-1.5", destacado ? "font-semibold" : "text-muted-foreground")}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          destacado ? cn("text-base font-bold", value >= 0 ? "text-success" : "text-destructive") : positivo ? "font-medium" : ""
        )}
      >
        {value < 0 ? "-" : ""}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
