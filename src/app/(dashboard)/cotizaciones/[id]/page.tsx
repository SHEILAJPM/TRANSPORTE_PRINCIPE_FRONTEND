"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Download,
  FileCheck2,
  Loader2,
  MapPin,
  Receipt,
  Send,
  Sparkles,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { EstadoCotizacionBadge } from "@/components/cotizaciones/estado-badge";
import { ConvertirCotizacionDialog } from "@/components/cotizaciones/convertir-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { abrirPdf, rutaPdfCotizacion } from "@/hooks/use-comprobantes";
import { useCotizacion, useCotizacionActions } from "@/hooks/use-cotizaciones";
import { useViajesPorCotizacion } from "@/hooks/use-viajes";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ResultadoConversion } from "@/types/api";

export default function CotizacionDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: cotizacion, isLoading } = useCotizacion(params.id);
  const { data: viajesGenerados } = useViajesPorCotizacion(cotizacion?.estado === "CONVERTIDA" ? params.id : null);
  const { cambiarEstado, cargando } = useCotizacionActions();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [resultadoReciente, setResultadoReciente] = useState<ResultadoConversion[] | null>(null);

  async function transicionar(estado: "ENVIADA" | "APROBADA" | "RECHAZADA") {
    if (!cotizacion) return;
    try {
      await cambiarEstado(cotizacion.id, estado);
      toast.success(`Cotización actualizada a ${estado.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    }
  }

  if (isLoading || !cotizacion) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{cotizacion.numero}</h2>
            <EstadoCotizacionBadge estado={cotizacion.estado} />
          </div>
          <p className="text-sm text-muted-foreground">
            Emitida el {formatDate(cotizacion.fecha_emision)} · Válida por {cotizacion.validez_dias} días
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => abrirPdf(rutaPdfCotizacion(cotizacion.id)).catch((err) => toast.error(err.message))}
        >
          <Download className="h-4 w-4" /> Descargar PDF
        </Button>
      </div>

      {resultadoReciente && (
        <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}>
          <Card className="border-success/30 bg-success/5">
            <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
              <span className="flex items-center gap-2 font-semibold text-success">
                <CheckCircle2 className="h-4 w-4" /> Documentos generados
              </span>
              {resultadoReciente.map((r) => (
                <span key={r.viaje.id} className="flex flex-wrap gap-3 text-muted-foreground">
                  <span>
                    Viaje <b className="text-foreground">{r.viaje.numero}</b>
                  </span>
                  <span>
                    GRE <b className="text-foreground">{r.guia_remision.numero}</b>
                  </span>
                  <span>
                    Factura <b className="text-foreground">{r.factura.numero}</b>
                  </span>
                  <span>
                    Constancia <b className="text-foreground">{r.constancia_pesos_medidas.numero}</b>
                  </span>
                </span>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{cotizacion.cliente?.razon_social}</p>
              <p className="text-sm text-muted-foreground">
                {cotizacion.cliente?.tipo_documento} {cotizacion.cliente?.numero_documento}
              </p>
              {cotizacion.cliente?.direccion && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {cotizacion.cliente.direccion}
                </p>
              )}
              <Separator className="my-4" />
              <p className="text-sm">{cotizacion.descripcion_servicio}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ruta y carga</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Origen</p>
                <p className="text-sm">{cotizacion.origen_direccion}</p>
                <p className="text-sm text-muted-foreground">
                  {cotizacion.origen_distrito}, {cotizacion.origen_provincia}, {cotizacion.origen_departamento}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destino</p>
                <p className="text-sm">{cotizacion.destino_direccion}</p>
                <p className="text-sm text-muted-foreground">
                  {cotizacion.destino_distrito}, {cotizacion.destino_provincia}, {cotizacion.destino_departamento}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground" />
                {cotizacion.cantidad_camiones} camión(es) · {cotizacion.peso_tm} TM
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Condiciones comerciales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{cotizacion.condiciones_comerciales}</p>
            </CardContent>
          </Card>

          {cotizacion.estado === "CONVERTIDA" && viajesGenerados && viajesGenerados.length > 0 && !resultadoReciente && (
            <Card className="border-primary/20 bg-accent/30">
              <CardContent className="flex items-center gap-3 p-4">
                <FileCheck2 className="h-5 w-5 text-primary" />
                <p className="text-sm">
                  Esta cotización ya fue convertida:{" "}
                  {viajesGenerados.map((v) => (
                    <Badge key={v.id} variant="default" className="ml-1">
                      {v.numero}
                    </Badge>
                  ))}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-primary" /> Precio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base</span>
                <span className="font-medium tabular-nums">{formatCurrency(cotizacion.precio_base)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {cotizacion.porcentaje_igv > 0 ? `IGV (${cotizacion.porcentaje_igv}%)` : "IGV"}
                </span>
                <span className="font-medium tabular-nums">
                  {cotizacion.porcentaje_igv > 0 ? formatCurrency(cotizacion.monto_igv) : "No aplica"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums text-primary">{formatCurrency(cotizacion.precio_total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cotizacion.estado === "BORRADOR" && (
                <Button className="w-full" onClick={() => transicionar("ENVIADA")} disabled={cargando}>
                  {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar al cliente
                </Button>
              )}

              {cotizacion.estado === "ENVIADA" && (
                <>
                  <Button className="w-full" onClick={() => transicionar("APROBADA")} disabled={cargando}>
                    {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Marcar como aprobada
                  </Button>
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => transicionar("RECHAZADA")} disabled={cargando}>
                    <Ban className="h-4 w-4" />
                    Rechazar
                  </Button>
                </>
              )}

              {cotizacion.estado === "APROBADA" && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className="relative w-full overflow-hidden"
                    size="lg"
                    onClick={() => setDialogoAbierto(true)}
                  >
                    <motion.span
                      className="absolute inset-0 bg-white/20"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                    />
                    <Sparkles className="h-4 w-4" />
                    Convertir a Viaje (1 clic)
                  </Button>
                </motion.div>
              )}

              {(cotizacion.estado === "RECHAZADA" || cotizacion.estado === "VENCIDA") && (
                <p className="text-center text-sm text-muted-foreground">
                  Esta cotización no admite más acciones.
                </p>
              )}

              {cotizacion.estado === "CONVERTIDA" && (
                <p className="text-center text-sm text-muted-foreground">Ya fue convertida a viaje.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConvertirCotizacionDialog
        cotizacion={cotizacion}
        open={dialogoAbierto}
        onOpenChange={setDialogoAbierto}
        onConvertida={setResultadoReciente}
      />
    </div>
  );
}
