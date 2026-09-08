"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Plus, Search } from "lucide-react";

import { EstadoCotizacionBadge } from "@/components/cotizaciones/estado-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCotizaciones } from "@/hooks/use-cotizaciones";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { EstadoCotizacion } from "@/types/api";

const FILTROS: { label: string; value: EstadoCotizacion | "TODAS" }[] = [
  { label: "Todas", value: "TODAS" },
  { label: "Borrador", value: "BORRADOR" },
  { label: "Enviadas", value: "ENVIADA" },
  { label: "Aprobadas", value: "APROBADA" },
  { label: "Convertidas", value: "CONVERTIDA" },
  { label: "Rechazadas", value: "RECHAZADA" },
];

export default function CotizacionesPage() {
  const { data: cotizaciones, isLoading } = useCotizaciones();
  const [filtro, setFiltro] = useState<EstadoCotizacion | "TODAS">("TODAS");
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (cotizaciones ?? []).filter((c) => {
      const coincideEstado = filtro === "TODAS" || c.estado === filtro;
      const coincideTexto =
        !texto ||
        c.numero.toLowerCase().includes(texto) ||
        c.cliente?.razon_social.toLowerCase().includes(texto) ||
        c.destino_distrito.toLowerCase().includes(texto) ||
        c.origen_distrito.toLowerCase().includes(texto);
      return coincideEstado && coincideTexto;
    });
  }, [cotizaciones, filtro, busqueda]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Cotizaciones</h2>
          <p className="text-sm text-muted-foreground">Genera, aprueba y convierte cotizaciones a viaje en un clic.</p>
        </div>
        <Button asChild>
          <Link href="/cotizaciones/nueva">
            <Plus />
            Nueva cotización
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
                  layoutId="filtro-cotizacion-activo"
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
            placeholder="Buscar por número, cliente o ciudad…"
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
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No se encontraron cotizaciones con ese filtro.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false}>
                {filtradas.map((c) => (
                  <motion.tr
                    key={c.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <TableCell className="p-0">
                      <Link href={`/cotizaciones/${c.id}`} className="block px-4 py-4 font-medium">
                        {c.numero}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{c.cliente?.razon_social ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.origen_distrito} → {c.destino_distrito}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.fecha_emision)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(c.precio_total)}</TableCell>
                    <TableCell>
                      <EstadoCotizacionBadge estado={c.estado} />
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
