"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FileCode2, FileText, Plus, Send } from "lucide-react";
import { toast } from "sonner";

import { FiltrosComprobantesBar, mesActual, rangoDelMes } from "@/components/comprobantes/filtros-comprobantes";
import { EstadoSunatBadge } from "@/components/viajes/estado-sunat-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  abrirPdf,
  descargarArchivo,
  rutaCdrGuiaRemision,
  rutaPdfGuiaRemision,
  rutaXmlGuiaRemision,
  useGuiasRemisionList,
  type FiltrosComprobantes,
} from "@/hooks/use-comprobantes";
import { formatDate } from "@/lib/utils";

export default function GuiasPage() {
  const [filtros, setFiltros] = useState<FiltrosComprobantes>(() => rangoDelMes(mesActual()));
  const { data: guias, isLoading } = useGuiasRemisionList(filtros);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Guías de remisión</h2>
          <p className="text-sm text-muted-foreground">Guías transportista emitidas a SUNAT, con su XML y constancia (CDR).</p>
        </div>
        <Button asChild>
          <Link href="/viajes/activar">
            <Plus className="h-4 w-4" />
            Nueva guía
          </Link>
        </Button>
      </div>

      <FiltrosComprobantesBar valor={filtros} onChange={setFiltros} />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (guias ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay guías con estos filtros.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guía</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Chofer</TableHead>
                <TableHead className="text-right">Peso</TableHead>
                <TableHead>SUNAT</TableHead>
                <TableHead className="text-right">Descargas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guias?.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="whitespace-nowrap">
                    <Link href={`/viajes/${g.viaje_id}?tab=liquidacion`} className="font-medium hover:underline">
                      {g.serie}-{g.numero}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{g.viaje_numero}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(g.fecha_emision)}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="block truncate">{g.cliente_razon_social}</span>
                    {g.destinatario_razon_social && g.destinatario_razon_social !== g.cliente_razon_social && (
                      <span className="block truncate text-xs text-muted-foreground">→ {g.destinatario_razon_social}</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {g.tracto_placa ?? "—"}
                    {g.carreta_placa ? ` / ${g.carreta_placa}` : ""}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-muted-foreground">{g.chofer_nombre ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                    {g.peso_bruto_total_kg.toLocaleString("es-PE")} kg
                  </TableCell>
                  <TableCell>
                    <EstadoSunatBadge estado={g.estado_sunat} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="PDF"
                        onClick={() => abrirPdf(rutaPdfGuiaRemision(g.viaje_id)).catch((e) => toast.error(e.message))}
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </Button>
                      {g.xml_firmado_disponible && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="XML firmado"
                          onClick={() =>
                            descargarArchivo(rutaXmlGuiaRemision(g.viaje_id), `GRE-${g.serie}-${g.numero}.xml`).catch((e) =>
                              toast.error(e.message)
                            )
                          }
                        >
                          <FileCode2 className="h-3.5 w-3.5" /> XML
                        </Button>
                      )}
                      {g.cdr_disponible && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Constancia de recepción de SUNAT"
                          onClick={() =>
                            descargarArchivo(rutaCdrGuiaRemision(g.viaje_id), `CDR-${g.serie}-${g.numero}.zip`).catch((e) =>
                              toast.error(e.message)
                            )
                          }
                        >
                          CDR
                        </Button>
                      )}
                      {g.estado_sunat !== "ACEPTADO" && (
                        <Button variant="ghost" size="sm" title="Revisar y emitir a SUNAT" asChild>
                          <Link href={`/viajes/${g.viaje_id}?tab=liquidacion&emitir=guia`}>
                            <Send className="h-3.5 w-3.5" /> Emitir
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
