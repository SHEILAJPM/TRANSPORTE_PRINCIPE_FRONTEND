"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, Plus, Receipt, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { FiltrosComprobantesBar, mesActual, rangoDelMes } from "@/components/comprobantes/filtros-comprobantes";
import { NuevaFacturaDialog } from "@/components/comprobantes/nueva-factura-dialog";
import { EmitirComprobanteDialog } from "@/components/viajes/emitir-comprobante-dialog";
import { EstadoSunatBadge } from "@/components/viajes/estado-sunat-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  abrirPdf,
  rutaPdfFactura,
  useFacturasList,
  useFacturasTotales,
  type FiltrosComprobantes,
} from "@/hooks/use-comprobantes";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Factura, ViajeFacturable } from "@/types/api";

const TIPO_LABEL: Record<string, string> = { FACTURA: "Factura", BOLETA: "Boleta", NOTA_CREDITO: "Nota de crédito" };

async function recargarListados() {
  await mutate((clave) => typeof clave === "string" && clave.startsWith("/comprobantes"));
}

export default function FacturasPage() {
  const [filtros, setFiltros] = useState<FiltrosComprobantes>(() => rangoDelMes(mesActual()));
  const { data: facturas, isLoading } = useFacturasList(filtros);
  const { data: totales } = useFacturasTotales(filtros);
  const [eligiendo, setEligiendo] = useState(false);
  const [viaje, setViaje] = useState<ViajeFacturable | null>(null);

  async function onEmitido(f: Factura) {
    await recargarListados();
    const nombre = `${TIPO_LABEL[f.tipo_documento]} ${f.serie}-${f.numero}`;
    if (f.estado_sunat === "ACEPTADO") toast.success(`${nombre} aceptada por SUNAT`);
    else if (f.estado_sunat === "PENDIENTE") toast.info(`${nombre} enviada; SUNAT aún no confirma`);
    else toast.error(f.mensaje_sunat ?? `SUNAT rechazó la ${nombre}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Facturas y boletas</h2>
          <p className="text-sm text-muted-foreground">Comprobantes de venta del flete, con su detracción y estado en SUNAT.</p>
        </div>
        <Button onClick={() => setEligiendo(true)}>
          <Plus className="h-4 w-4" />
          Nueva factura
        </Button>
      </div>

      <FiltrosComprobantesBar valor={filtros} onChange={setFiltros} mostrarTipo />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Valor de venta (base)", totales?.base],
          ["IGV", totales?.igv],
          ["Total facturado", totales?.total],
          ["Detracciones", totales?.detracciones],
        ].map(([etiqueta, valor]) => (
          <Card key={etiqueta as string}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{etiqueta}</p>
              <p className="mt-1 text-xl font-bold">{valor === undefined ? "—" : formatCurrency(valor as number)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Totales del periodo filtrado: {totales?.cantidad ?? 0} comprobante(s) aceptado(s) por SUNAT. Los pendientes y
        rechazados no suman; las notas de crédito restan.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (facturas ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay comprobantes con estos filtros.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprobante</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Guía / placa</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Detracción</TableHead>
                <TableHead>SUNAT</TableHead>
                <TableHead className="text-right">Descargas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas?.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="whitespace-nowrap">
                    {f.viaje_id ? (
                      <Link href={`/viajes/${f.viaje_id}?tab=liquidacion`} className="font-medium hover:underline">
                        {f.serie}-{f.numero}
                      </Link>
                    ) : (
                      <span className="font-medium">{f.serie}-{f.numero}</span>
                    )}
                    <span className="block text-xs text-muted-foreground">{TIPO_LABEL[f.tipo_documento]}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(f.fecha_emision)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{f.cliente_razon_social}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {f.guia_remision ?? "—"}
                    {f.tracto_placa && <span className="block text-xs">{f.tracto_placa}</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">
                    {f.tipo_documento === "NOTA_CREDITO" ? "−" : ""}
                    {formatCurrency(f.total)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                    {f.detraccion_monto ? formatCurrency(f.detraccion_monto) : "—"}
                  </TableCell>
                  <TableCell>
                    <EstadoSunatBadge estado={f.estado_sunat} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {f.viaje_id && f.tipo_documento !== "NOTA_CREDITO" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="PDF"
                          onClick={() => abrirPdf(rutaPdfFactura(f.viaje_id!)).catch((e) => toast.error(e.message))}
                        >
                          <Download className="h-3.5 w-3.5" /> PDF
                        </Button>
                      )}
                      {f.pdf_url && (
                        <Button variant="ghost" size="sm" title="PDF oficial de SUNAT" asChild>
                          <a href={f.pdf_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" /> SUNAT
                          </a>
                        </Button>
                      )}
                      {f.xml_url && (
                        <Button variant="ghost" size="sm" title="XML" asChild>
                          <a href={f.xml_url} target="_blank" rel="noopener noreferrer">
                            XML
                          </a>
                        </Button>
                      )}
                      {f.estado_sunat === "PENDIENTE" && f.viaje_id && (
                        <Button variant="ghost" size="sm" title="Reintentar envío" asChild>
                          <Link href={`/viajes/${f.viaje_id}?tab=liquidacion`}>
                            <RefreshCw className="h-3.5 w-3.5" />
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

      <NuevaFacturaDialog
        open={eligiendo}
        onOpenChange={setEligiendo}
        onElegir={(v) => {
          setEligiendo(false);
          setViaje(v);
        }}
      />
      {viaje && (
        <EmitirComprobanteDialog
          viajeId={viaje.viaje_id}
          viajeNumero={viaje.viaje_numero}
          open={viaje !== null}
          onOpenChange={(abierto) => !abierto && setViaje(null)}
          onEmitido={onEmitido}
          onError={async (mensaje) => {
            await recargarListados();
            toast.error(mensaje);
          }}
        />
      )}
    </div>
  );
}
