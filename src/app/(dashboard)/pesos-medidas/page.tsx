"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDebounce } from "use-debounce";
import { AlertTriangle, Download, Scale, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { abrirPdf, rutaPdfConstancia } from "@/hooks/use-comprobantes";
import { useConstancias } from "@/hooks/use-pesos-medidas";
import { formatDate } from "@/lib/utils";

export default function PesosMedidasPage() {
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced] = useDebounce(busqueda, 350);
  const { data: constancias, isLoading } = useConstancias(busquedaDebounced);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pesos y Medidas</h2>
        <p className="text-sm text-muted-foreground">
          Constancias de Verificación de Pesos y Medidas (DS N.° 058-2003-MTC), vinculadas a cada Guía de Remisión.
        </p>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por N.° de constancia, placa o guía…"
          className="pl-9"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (constancias ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Scale className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No se encontraron constancias.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N.° Constancia</TableHead>
                <TableHead>GRE</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Chofer</TableHead>
                <TableHead>Generador de carga</TableHead>
                <TableHead className="text-right">Peso neto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {constancias?.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                >
                  <TableCell className="p-0">
                    <Link href={`/viajes/${c.viaje_id}`} className="block px-4 py-3.5 font-medium">
                      {c.numero}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.guia_remision_numero}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.tracto_placa}
                    {c.carreta_placa ? ` / ${c.carreta_placa}` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.chofer_nombre}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">{c.generador_carga}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {c.peso_neto_kg.toLocaleString("es-PE")} kg
                      {c.excede_limite && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3" /> Excede
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.fecha_verificacion, true)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirPdf(rutaPdfConstancia(c.id)).catch((err) => toast.error(err.message))}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
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
