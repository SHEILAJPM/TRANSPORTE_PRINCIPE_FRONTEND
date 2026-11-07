"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Phone, Search, Users } from "lucide-react";

import { ChoferFormDialog } from "@/components/choferes/chofer-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useChoferes } from "@/hooks/use-choferes";
import { formatCurrency, formatDate, parseFecha } from "@/lib/utils";

export default function ChoferesPage() {
  const { data: choferes, isLoading } = useChoferes(false);
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return choferes ?? [];
    return (choferes ?? []).filter(
      (c) =>
        `${c.nombres} ${c.apellidos}`.toLowerCase().includes(texto) ||
        c.dni.includes(texto) ||
        c.licencia_numero.toLowerCase().includes(texto)
    );
  }, [choferes, busqueda]);

  const hoy = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Choferes</h2>
          <p className="text-sm text-muted-foreground">Brevete A-III-C, exámenes médicos y tarifas de dietas.</p>
        </div>
        <ChoferFormDialog />
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, DNI o licencia…" className="pl-9" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No se encontraron choferes.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chofer</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Tarifa diaria</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((c, i) => {
                const licenciaVencida = parseFecha(c.licencia_vencimiento) < hoy;
                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <ChoferFormDialog
                      chofer={c}
                      trigger={
                        <TableCell className="p-0">
                          <div className="px-4 py-4">
                            <p className="font-medium">
                              {c.nombres} {c.apellidos}
                            </p>
                            {c.telefono && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" /> {c.telefono}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      }
                    />
                    <TableCell className="text-muted-foreground">{c.dni}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.licencia_numero} · {c.licencia_categoria}
                    </TableCell>
                    <TableCell className={licenciaVencida ? "font-medium text-destructive" : "text-muted-foreground"}>
                      {formatDate(c.licencia_vencimiento)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(c.tarifa_diaria_default)}</TableCell>
                    <TableCell>
                      <Badge variant={c.activo ? "success" : "secondary"}>{c.activo ? "Activo" : "Inactivo"}</Badge>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
