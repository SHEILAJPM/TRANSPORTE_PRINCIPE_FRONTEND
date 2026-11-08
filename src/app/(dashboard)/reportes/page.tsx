"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useDebounce } from "use-debounce";
import { BarChart3, MapPin, TrendingDown, TrendingUp, Wallet, X } from "lucide-react";

import { ClientePicker } from "@/components/cotizaciones/cliente-picker";
import { EstadoViajeBadge } from "@/components/viajes/estado-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReporteViajes } from "@/hooks/use-reportes";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Cliente } from "@/types/api";

export default function ReportesPage() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [placa, setPlaca] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [placaDebounced] = useDebounce(placa, 350);
  const [ciudadDebounced] = useDebounce(ciudad, 350);

  const { data: resultados, isLoading } = useReporteViajes({
    cliente_id: cliente?.id,
    placa: placaDebounced || undefined,
    ciudad: ciudadDebounced || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
  });

  const totales = useMemo(() => {
    const filas = resultados ?? [];
    return {
      ingresos: filas.reduce((acc, r) => acc + r.ingresos_netos_flete, 0),
      egresos: filas.reduce((acc, r) => acc + r.egresos_totales, 0),
      ganancia: filas.reduce((acc, r) => acc + r.ganancia_neta, 0),
    };
  }, [resultados]);

  const hayFiltros = Boolean(cliente || placa || ciudad || fechaDesde || fechaHasta);

  function limpiarFiltros() {
    setCliente(null);
    setPlaca("");
    setCiudad("");
    setFechaDesde("");
    setFechaHasta("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reportes</h2>
        <p className="text-sm text-muted-foreground">
          Historial de cobros por viaje, con buscador geográfico avanzado por ciudad, cliente, placa y fecha.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ingresos netos" value={totales.ingresos} icon={TrendingUp} tone="success" />
        <StatCard label="Egresos totales" value={totales.egresos} icon={TrendingDown} tone="warning" />
        <StatCard label="Ganancia neta" value={totales.ganancia} icon={Wallet} tone={totales.ganancia >= 0 ? "primary" : "destructive"} />
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 lg:col-span-1">
            <Label>Cliente</Label>
            <ClientePicker value={cliente} onChange={setCliente} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="placa">Placa</Label>
            <Input id="placa" placeholder="Camión o carreta" value={placa} onChange={(e) => setPlaca(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ciudad">Ciudad / provincia</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="ciudad" placeholder="Origen o destino" className="pl-9" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="fecha_desde">Desde</Label>
              <Input id="fecha_desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_hasta">Hasta</Label>
              <Input id="fecha_hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
          </div>
          {hayFiltros && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                <X className="h-3.5 w-3.5" /> Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (resultados ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No se encontraron viajes con esos filtros.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Viaje</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Egresos</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultados?.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{r.numero}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-muted-foreground">{r.cliente_razon_social}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.placa_tracto}
                    {r.placa_carreta ? ` / ${r.placa_carreta}` : ""}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {r.origen} → {r.destino}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(r.fecha_salida_programada)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.ingresos_netos_flete)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatCurrency(r.egresos_totales)}</TableCell>
                  <TableCell className={cn("text-right font-semibold", r.ganancia_neta >= 0 ? "text-success" : "text-destructive")}>
                    {formatCurrency(r.ganancia_neta)}
                  </TableCell>
                  <TableCell>
                    <EstadoViajeBadge estado={r.estado} />
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof TrendingUp;
  tone: "success" | "warning" | "primary" | "destructive";
}) {
  const toneClasses = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneClasses)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(value)}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
