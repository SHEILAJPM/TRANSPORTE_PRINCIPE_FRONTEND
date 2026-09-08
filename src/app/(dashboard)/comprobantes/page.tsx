"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDebounce } from "use-debounce";
import { Download, FileText, Receipt, Search, Send } from "lucide-react";
import { toast } from "sonner";

import { EstadoSunatBadge } from "@/components/viajes/estado-sunat-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  abrirPdf,
  rutaPdfFactura,
  rutaPdfGuiaRemision,
  useFacturasList,
  useGuiasRemisionList,
} from "@/hooks/use-comprobantes";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { EstadoSunat } from "@/types/api";

const TIPO_DOCUMENTO_LABEL: Record<string, string> = {
  FACTURA: "Factura",
  BOLETA: "Boleta",
  NOTA_CREDITO: "Nota de Crédito",
};

const ESTADOS: { label: string; value: EstadoSunat | "TODOS" }[] = [
  { label: "Todos los estados", value: "TODOS" },
  { label: "Pendiente", value: "PENDIENTE" },
  { label: "Aceptado", value: "ACEPTADO" },
  { label: "Rechazado", value: "RECHAZADO" },
  { label: "Anulado", value: "ANULADO" },
];

export default function ComprobantesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Comprobantes</h2>
        <p className="text-sm text-muted-foreground">
          Guías de Remisión, Facturas, Boletas y Notas de Crédito emitidas a SUNAT, en un solo lugar.
        </p>
      </div>

      <Tabs defaultValue="guias">
        <TabsList className="grid w-full grid-cols-2 sm:w-80">
          <TabsTrigger value="guias">Guías de Remisión</TabsTrigger>
          <TabsTrigger value="facturas">Facturas y Boletas</TabsTrigger>
        </TabsList>

        <TabsContent value="guias">
          <GuiasTab />
        </TabsContent>
        <TabsContent value="facturas">
          <FacturasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GuiasTab() {
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced] = useDebounce(busqueda, 350);
  const [estado, setEstado] = useState<EstadoSunat | "TODOS">("TODOS");
  const { data: guias, isLoading } = useGuiasRemisionList({
    q: busquedaDebounced || undefined,
    estado_sunat: estado === "TODOS" ? undefined : estado,
  });

  return (
    <div className="space-y-4 pt-4">
      <Filtros busqueda={busqueda} onBusqueda={setBusqueda} estado={estado} onEstado={setEstado} placeholder="Buscar por N.° de guía, viaje o cliente…" />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <ListaEsqueleto />
        ) : (guias ?? []).length === 0 ? (
          <ListaVacia icon={FileText} texto="No se encontraron guías de remisión." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serie-Número</TableHead>
                <TableHead>Viaje</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Peso bruto</TableHead>
                <TableHead>Estado SUNAT</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {guias?.map((g, i) => (
                <motion.tr
                  key={g.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                >
                  <TableCell className="p-0">
                    <Link href={`/viajes/${g.viaje_id}`} className="block px-4 py-3.5 font-medium">
                      {g.serie}-{g.numero}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{g.viaje_numero}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">{g.cliente_razon_social}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(g.fecha_emision, true)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
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
                        title="PDF interno"
                        onClick={() => abrirPdf(rutaPdfGuiaRemision(g.viaje_id)).catch((err) => toast.error(err.message))}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      {g.estado_sunat !== "ACEPTADO" && (
                        <Link href={`/viajes/${g.viaje_id}?tab=liquidacion`}>
                          <Button variant="ghost" size="sm" title="Ir a emitir a SUNAT">
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
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

function FacturasTab() {
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced] = useDebounce(busqueda, 350);
  const [estado, setEstado] = useState<EstadoSunat | "TODOS">("TODOS");
  const { data: facturas, isLoading } = useFacturasList({
    q: busquedaDebounced || undefined,
    estado_sunat: estado === "TODOS" ? undefined : estado,
  });

  return (
    <div className="space-y-4 pt-4">
      <Filtros busqueda={busqueda} onBusqueda={setBusqueda} estado={estado} onEstado={setEstado} placeholder="Buscar por N.° de comprobante, viaje o cliente…" />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <ListaEsqueleto />
        ) : (facturas ?? []).length === 0 ? (
          <ListaVacia icon={Receipt} texto="No se encontraron facturas ni boletas." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Serie-Número</TableHead>
                <TableHead>Viaje</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado SUNAT</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas?.map((f, i) => (
                <motion.tr
                  key={f.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                >
                  <TableCell className="text-muted-foreground">{TIPO_DOCUMENTO_LABEL[f.tipo_documento]}</TableCell>
                  <TableCell className="p-0">
                    {f.viaje_id ? (
                      <Link href={`/viajes/${f.viaje_id}`} className="block px-4 py-3.5 font-medium">
                        {f.serie}-{f.numero}
                      </Link>
                    ) : (
                      <span className="block px-4 py-3.5 font-medium">{f.serie}-{f.numero}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{f.viaje_numero ?? "—"}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">{f.cliente_razon_social}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(f.fecha_emision, true)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(f.total)}</TableCell>
                  <TableCell>
                    <EstadoSunatBadge estado={f.estado_sunat} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {f.tipo_documento !== "NOTA_CREDITO" && f.viaje_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="PDF interno"
                          onClick={() => abrirPdf(rutaPdfFactura(f.viaje_id!)).catch((err) => toast.error(err.message))}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {f.tipo_documento !== "NOTA_CREDITO" && f.estado_sunat !== "ACEPTADO" && f.viaje_id && (
                        <Link href={`/viajes/${f.viaje_id}?tab=liquidacion`}>
                          <Button variant="ghost" size="sm" title="Ir a emitir a SUNAT">
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                      {f.tipo_documento === "NOTA_CREDITO" && f.pdf_url && (
                        <a
                          href={f.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-primary underline underline-offset-2"
                        >
                          PDF SUNAT
                        </a>
                      )}
                    </div>
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

function Filtros({
  busqueda,
  onBusqueda,
  estado,
  onEstado,
  placeholder,
}: {
  busqueda: string;
  onBusqueda: (v: string) => void;
  estado: EstadoSunat | "TODOS";
  onEstado: (v: EstadoSunat | "TODOS") => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={placeholder} className="pl-9" value={busqueda} onChange={(e) => onBusqueda(e.target.value)} />
      </div>
      <Select value={estado} onValueChange={(v) => onEstado(v as EstadoSunat | "TODOS")}>
        <SelectTrigger className="sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ESTADOS.map((e) => (
            <SelectItem key={e.value} value={e.value}>
              {e.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ListaEsqueleto() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function ListaVacia({ icon: Icon, texto }: { icon: typeof FileText; texto: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{texto}</p>
    </div>
  );
}
