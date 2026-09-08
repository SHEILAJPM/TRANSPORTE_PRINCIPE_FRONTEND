"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Route, Search } from "lucide-react";

import { EstadoViajeBadge } from "@/components/viajes/estado-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useViajes } from "@/hooks/use-viajes";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { EstadoViaje } from "@/types/api";

const FILTROS: { label: string; value: EstadoViaje | "TODOS" }[] = [
  { label: "Todos", value: "TODOS" },
  { label: "Programados", value: "PROGRAMADO" },
  { label: "En ruta", value: "EN_RUTA" },
  { label: "Finalizados", value: "FINALIZADO" },
  { label: "Liquidados", value: "LIQUIDADO" },
  { label: "Cancelados", value: "CANCELADO" },
];

export default function ViajesPage() {
  const { data: viajes, isLoading } = useViajes();
  const [filtro, setFiltro] = useState<EstadoViaje | "TODOS">("TODOS");
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (viajes ?? []).filter((v) => {
      const coincideEstado = filtro === "TODOS" || v.estado === filtro;
      const coincideTexto =
        !texto ||
        v.numero.toLowerCase().includes(texto) ||
        v.cliente?.razon_social.toLowerCase().includes(texto) ||
        v.tracto?.placa.toLowerCase().includes(texto) ||
        v.carreta?.placa.toLowerCase().includes(texto) ||
        v.destino_distrito.toLowerCase().includes(texto) ||
        v.origen_distrito.toLowerCase().includes(texto);
      return coincideEstado && coincideTexto;
    });
  }, [viajes, filtro, busqueda]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Viajes</h2>
          <p className="text-sm text-muted-foreground">Activación, seguimiento y liquidación de viajes.</p>
        </div>
        <Button asChild>
          <Link href="/viajes/activar">
            <Plus />
            Activar viaje
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={cn(
                "relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                filtro === f.value ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filtro === f.value && (
                <motion.span
                  layoutId="filtro-viaje-activo"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente, placa…"
            className="pl-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Route className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No se encontraron viajes con ese filtro.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead className="text-right">Flete</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false}>
                {filtrados.map((v) => (
                  <motion.tr
                    key={v.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <TableCell className="p-0">
                      <Link href={`/viajes/${v.id}`} className="block px-4 py-4 font-medium">
                        {v.numero}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{v.cliente?.razon_social ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.tracto?.placa ?? "—"}
                      {v.carreta ? ` / ${v.carreta.placa}` : ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.origen_distrito} → {v.destino_distrito}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(v.fecha_salida_programada, true)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(v.ingreso_flete_neto)}</TableCell>
                    <TableCell>
                      <EstadoViajeBadge estado={v.estado} />
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
