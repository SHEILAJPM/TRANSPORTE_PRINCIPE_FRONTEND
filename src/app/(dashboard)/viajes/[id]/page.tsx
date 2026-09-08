"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Download,
  FileText,
  Fuel,
  Loader2,
  MapPin,
  Play,
  Receipt,
  Save,
  Scale,
  Send,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { RegistrarGastoDialog } from "@/components/viajes/registrar-gasto-dialog";
import { ReportarNovedadDialog } from "@/components/viajes/reportar-novedad-dialog";
import { EstadoViajeBadge } from "@/components/viajes/estado-badge";
import { EstadoSunatBadge } from "@/components/viajes/estado-sunat-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  abrirPdf,
  rutaPdfConstancia,
  rutaPdfFactura,
  rutaPdfGuiaRemision,
  useActualizarGuiaRemision,
  useAnularFactura,
  useEmitirFacturaSunat,
  useEmitirGuiaRemisionSunat,
  useFactura,
  useGuiaRemision,
} from "@/hooks/use-comprobantes";
import { useGastos } from "@/hooks/use-gastos";
import { useLiquidacionActions, useRentabilidad } from "@/hooks/use-liquidacion";
import { useNovedades } from "@/hooks/use-novedades";
import { useConstanciaPorViaje, usePesosMedidasActions } from "@/hooks/use-pesos-medidas";
import { useViaje, useViajeActions } from "@/hooks/use-viajes";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Liquidacion } from "@/types/api";

const TIPO_GASTO_LABEL: Record<string, string> = {
  COMBUSTIBLE: "Combustible",
  PEAJE: "Peaje",
  VIATICO: "Viático",
  ADELANTO: "Adelanto",
  OTRO: "Otro",
};

export default function ViajeDetallePage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-5xl" />}>
      <ViajeDetalleContenido />
    </Suspense>
  );
}

function ViajeDetalleContenido() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabInicial = searchParams.get("tab") ?? "resumen";
  const { data: viaje, isLoading } = useViaje(params.id);
  const { cambiarEstado, cargando: cambiandoEstado } = useViajeActions();

  async function transicionar(estado: "EN_RUTA" | "FINALIZADO" | "CANCELADO") {
    const extra =
      estado === "EN_RUTA"
        ? { fecha_salida_real: new Date().toISOString() }
        : estado === "FINALIZADO"
          ? { fecha_llegada_real: new Date().toISOString() }
          : undefined;
    try {
      await cambiarEstado(params.id, estado, extra);
      toast.success(`Viaje actualizado a ${estado.toLowerCase().replace("_", " ")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el viaje");
    }
  }

  if (isLoading || !viaje) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{viaje.numero}</h2>
            <EstadoViajeBadge estado={viaje.estado} />
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {viaje.origen_distrito} → {viaje.destino_distrito} · {formatDate(viaje.fecha_salida_programada, true)}
          </p>
        </div>

        <div className="flex gap-2">
          {viaje.estado === "PROGRAMADO" && (
            <Button onClick={() => transicionar("EN_RUTA")} disabled={cambiandoEstado}>
              {cambiandoEstado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Iniciar viaje
            </Button>
          )}
          {viaje.estado === "EN_RUTA" && (
            <Button onClick={() => transicionar("FINALIZADO")} disabled={cambiandoEstado}>
              {cambiandoEstado ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Finalizar viaje
            </Button>
          )}
          {(viaje.estado === "PROGRAMADO" || viaje.estado === "EN_RUTA") && (
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => transicionar("CANCELADO")} disabled={cambiandoEstado}>
              <Ban className="h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-4">
          <Info label="Cliente" value={viaje.cliente?.razon_social ?? "—"} />
          <Info label="Unidad" value={`${viaje.tracto?.placa ?? "—"}${viaje.carreta ? ` / ${viaje.carreta.placa}` : ""}`} />
          <Info label="Chofer" value={viaje.chofer ? `${viaje.chofer.nombres} ${viaje.chofer.apellidos}` : "—"} />
          <Info label="Peso / Flete" value={`${viaje.peso_tm} TM · ${formatCurrency(viaje.ingreso_flete_neto)}`} />
        </CardContent>
      </Card>

      <Tabs defaultValue={tabInicial}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="novedades">Novedades</TabsTrigger>
          <TabsTrigger value="pesos">Pesos y Medidas</TabsTrigger>
          <TabsTrigger value="liquidacion">Liquidación</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <ResumenTab viaje={viaje} />
        </TabsContent>
        <TabsContent value="gastos">
          <GastosTab viajeId={viaje.id} />
        </TabsContent>
        <TabsContent value="novedades">
          <NovedadesTab viajeId={viaje.id} />
        </TabsContent>
        <TabsContent value="pesos">
          <PesosMedidasTab viajeId={viaje.id} />
        </TabsContent>
        <TabsContent value="liquidacion">
          <LiquidacionTab viajeId={viaje.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function ResumenTab({ viaje }: { viaje: NonNullable<ReturnType<typeof useViaje>["data"]> }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ruta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Origen</p>
            <p>{viaje.origen_direccion}</p>
            <p className="text-muted-foreground">
              {viaje.origen_distrito}, {viaje.origen_provincia}, {viaje.origen_departamento}
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Destino</p>
            <p>{viaje.destino_direccion}</p>
            <p className="text-muted-foreground">
              {viaje.destino_distrito}, {viaje.destino_provincia}, {viaje.destino_departamento}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fechas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Salida programada</span>
            <span>{formatDate(viaje.fecha_salida_programada, true)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Salida real</span>
            <span>{viaje.fecha_salida_real ? formatDate(viaje.fecha_salida_real, true) : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Llegada real</span>
            <span>{viaje.fecha_llegada_real ? formatDate(viaje.fecha_llegada_real, true) : "—"}</span>
          </div>
          {viaje.observaciones && (
            <>
              <Separator />
              <p className="text-muted-foreground">{viaje.observaciones}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GastosTab({ viajeId }: { viajeId: string }) {
  const { data: gastos, isLoading } = useGastos(viajeId);
  const total = (gastos ?? []).reduce((acc, g) => acc + g.monto, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Fuel className="h-4 w-4" /> Gastos del viaje
        </CardTitle>
        <RegistrarGastoDialog viajeId={viajeId} />
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <Skeleton className="h-24 w-full" />}
        {!isLoading && (gastos ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay gastos registrados.</p>
        )}
        {gastos?.map((g) => (
          <div key={g.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
            <div>
              <p className="font-medium">
                {TIPO_GASTO_LABEL[g.tipo_gasto] ?? g.tipo_gasto}
                {g.grifo_nombre ? ` · ${g.grifo_nombre}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(g.fecha, true)}
                {g.galones ? ` · ${g.galones} gal` : ""}
                {g.numero_ticket ? ` · Ticket ${g.numero_ticket}` : ""}
              </p>
            </div>
            <span className="font-semibold tabular-nums">{formatCurrency(g.monto)}</span>
          </div>
        ))}
        {(gastos ?? []).length > 0 && (
          <div className="flex justify-between border-t border-border pt-3 text-sm font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NovedadesTab({ viajeId }: { viajeId: string }) {
  const { data: novedades, isLoading } = useNovedades(viajeId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Novedades en ruta</CardTitle>
        <ReportarNovedadDialog viajeId={viajeId} />
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <Skeleton className="h-24 w-full" />}
        {!isLoading && (novedades ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin novedades reportadas. Todo en orden.</p>
        )}
        {novedades?.map((n) => (
          <div key={n.id} className="rounded-lg border border-border px-3 py-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{n.tipo_novedad.replace(/_/g, " ")}</span>
              <span className="text-xs text-muted-foreground">{formatDate(n.fecha, true)}</span>
            </div>
            <p className="mt-1 text-muted-foreground">{n.descripcion}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PesosMedidasTab({ viajeId }: { viajeId: string }) {
  const { data: constancia, isLoading } = useConstanciaPorViaje(viajeId);
  const { actualizar, cargando } = usePesosMedidasActions(viajeId);
  const [pesoBruto, setPesoBruto] = useState<string>("");
  const [tara, setTara] = useState<string>("");
  const [precinto, setPrecinto] = useState<string>("");
  const [editando, setEditando] = useState(false);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!constancia) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Este viaje aún no tiene Constancia de Pesos y Medidas emitida.
        </CardContent>
      </Card>
    );
  }

  function iniciarEdicion() {
    setPesoBruto(String(constancia!.peso_bruto_kg));
    setTara(String(constancia!.tara_kg));
    setPrecinto(constancia!.precinto_seguridad ?? "");
    setEditando(true);
  }

  async function guardar() {
    try {
      await actualizar(constancia!.id, {
        peso_bruto_kg: Number(pesoBruto),
        tara_kg: Number(tara),
        precinto_seguridad: precinto || null,
      });
      toast.success("Constancia actualizada");
      setEditando(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la constancia");
    }
  }

  const excedePeso = constancia.peso_bruto_kg > constancia.peso_bruto_max_kg;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-4 w-4" /> Constancia {constancia.numero}
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => abrirPdf(rutaPdfConstancia(constancia.id)).catch((err) => toast.error(err.message))}
        >
          <Download className="h-4 w-4" /> PDF
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Configuración" value={constancia.configuracion_vehicular} />
          <Info label="Dimensiones (LxAxA)" value={`${constancia.largo_m} × ${constancia.ancho_m} × ${constancia.alto_m} m`} />
          <Info label="Peso máx. permitido" value={`${constancia.peso_bruto_max_kg} kg`} />
          <Info label="Licencia chofer" value={constancia.numero_licencia_chofer} />
        </div>

        <Separator />

        {!editando ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Info label="Peso bruto" value={`${constancia.peso_bruto_kg} kg`} />
            <Info label="Tara" value={`${constancia.tara_kg} kg`} />
            <Info label="Peso neto" value={`${constancia.peso_neto_kg} kg`} />
            <Info label="Precinto" value={constancia.precinto_seguridad ?? "No registrado"} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Peso bruto (kg)</Label>
              <Input type="number" step="0.01" value={pesoBruto} onChange={(e) => setPesoBruto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tara (kg)</Label>
              <Input type="number" step="0.01" value={tara} onChange={(e) => setTara(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Precinto</Label>
              <Input value={precinto} onChange={(e) => setPrecinto(e.target.value)} />
            </div>
          </div>
        )}

        {excedePeso && (
          <p className="text-sm font-medium text-destructive">
            ⚠ El peso bruto verificado excede el máximo permitido para esta configuración vehicular.
          </p>
        )}

        <div className="flex justify-end gap-2">
          {editando ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditando(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={guardar} disabled={cargando}>
                {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={iniciarEdicion}>
              Editar balanza / precinto
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LiquidacionTab({ viajeId }: { viajeId: string }) {
  const { data: guia, mutate: recargarGuia } = useGuiaRemision(viajeId);
  const { data: factura, mutate: recargarFactura } = useFactura(viajeId);
  const { data: rentabilidad, mutate: recargarRentabilidad } = useRentabilidad(viajeId);
  const { calcular, cargando } = useLiquidacionActions(viajeId);
  const { emitir: emitirGuiaSunat, cargando: emitiendoGuia } = useEmitirGuiaRemisionSunat(viajeId);
  const { emitir: emitirFacturaSunat, cargando: emitiendoFactura } = useEmitirFacturaSunat(viajeId);
  const { actualizar: actualizarGuiaRemitente, cargando: guardandoRemitente } = useActualizarGuiaRemision(viajeId);
  const { anular: anularFactura, cargando: anulando } = useAnularFactura(viajeId);
  const [liquidacion, setLiquidacion] = useState<Liquidacion | null>(null);
  const [remitenteRuc, setRemitenteRuc] = useState("");
  const [remitenteSerie, setRemitenteSerie] = useState("");
  const [remitenteNumero, setRemitenteNumero] = useState("");
  const [motivoAnulacion, setMotivoAnulacion] = useState("");

  useEffect(() => {
    if (guia) {
      setRemitenteRuc(guia.remitente_guia_ruc_emisor ?? "");
      setRemitenteSerie(guia.remitente_guia_serie ?? "");
      setRemitenteNumero(guia.remitente_guia_numero ?? "");
    }
  }, [guia]);

  async function onCalcular() {
    try {
      const data = await calcular();
      setLiquidacion(data);
      await recargarRentabilidad();
      toast.success("Liquidación calculada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo calcular la liquidación");
    }
  }

  async function onEmitirGuiaSunat() {
    try {
      const data = await emitirGuiaSunat();
      await recargarGuia();
      if (data.estado_sunat === "ACEPTADO") {
        toast.success("Guía de remisión aceptada por SUNAT");
      } else {
        toast.error(data.mensaje_sunat ?? "SUNAT rechazó el documento, revisa los datos");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo emitir la guía a SUNAT");
    }
  }

  async function onGuardarRemitente() {
    try {
      await actualizarGuiaRemitente({
        remitente_guia_ruc_emisor: remitenteRuc || null,
        remitente_guia_serie: remitenteSerie || null,
        remitente_guia_numero: remitenteNumero || null,
      });
      toast.success("Referencia de la guía remitente guardada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la referencia");
    }
  }

  async function onEmitirFacturaSunat() {
    try {
      const data = await emitirFacturaSunat();
      await recargarFactura();
      if (data.estado_sunat === "ACEPTADO") {
        toast.success("Factura aceptada por SUNAT");
      } else {
        toast.error(data.mensaje_sunat ?? "SUNAT rechazó el documento, revisa los datos");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo emitir la factura a SUNAT");
    }
  }

  async function onAnularFactura() {
    try {
      const data = await anularFactura(motivoAnulacion);
      await recargarFactura();
      if (data.estado_sunat === "ANULADO") {
        toast.success("Comprobante anulado ante SUNAT");
      } else {
        toast.error(data.mensaje_sunat ?? "No se pudo confirmar la anulación, revisa el estado en unos minutos");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo anular el comprobante");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" /> Documentos generados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {guia && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => abrirPdf(rutaPdfGuiaRemision(viajeId)).catch((e) => toast.error(e.message))}>
                  <Download className="h-4 w-4" /> GRE {guia.serie}-{guia.numero} (PDF interno)
                </Button>
                <EstadoSunatBadge estado={guia.estado_sunat} />
                {guia.estado_sunat !== "ACEPTADO" && (
                  <Button size="sm" onClick={onEmitirGuiaSunat} disabled={emitiendoGuia}>
                    {emitiendoGuia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Emitir a SUNAT
                  </Button>
                )}
                {guia.pdf_url && (
                  <a href={guia.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline underline-offset-2">
                    Ver PDF oficial de SUNAT
                  </a>
                )}
              </div>
              {guia.estado_sunat === "RECHAZADO" && guia.mensaje_sunat && (
                <p className="text-sm text-destructive">{guia.mensaje_sunat}</p>
              )}
              {guia.estado_sunat !== "ACEPTADO" && (
                <div className="rounded-lg border border-dashed p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Guía Remitente del cliente (opcional): si el cliente ya generó su propia guía de remisión en
                    SUNAT, referénciala aquí antes de emitir para incluirla en el envío.
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <div className="space-y-1">
                      <Label htmlFor="remitente-ruc" className="text-xs">RUC del cliente</Label>
                      <Input
                        id="remitente-ruc"
                        value={remitenteRuc}
                        onChange={(e) => setRemitenteRuc(e.target.value)}
                        placeholder="20609286696"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="remitente-serie" className="text-xs">Serie</Label>
                      <Input
                        id="remitente-serie"
                        value={remitenteSerie}
                        onChange={(e) => setRemitenteSerie(e.target.value)}
                        placeholder="T001"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="remitente-numero" className="text-xs">Número</Label>
                      <Input
                        id="remitente-numero"
                        value={remitenteNumero}
                        onChange={(e) => setRemitenteNumero(e.target.value)}
                        placeholder="123"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" size="sm" onClick={onGuardarRemitente} disabled={guardandoRemitente}>
                        {guardandoRemitente ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {factura && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => abrirPdf(rutaPdfFactura(viajeId)).catch((e) => toast.error(e.message))}>
                  <Download className="h-4 w-4" />
                  {factura.tipo_documento === "FACTURA" ? "Factura" : "Boleta"} {factura.serie}-{factura.numero} (PDF interno)
                </Button>
                <EstadoSunatBadge estado={factura.estado_sunat} />
                {factura.estado_sunat !== "ACEPTADO" && (
                  <Button size="sm" onClick={onEmitirFacturaSunat} disabled={emitiendoFactura}>
                    {emitiendoFactura ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Emitir a SUNAT
                  </Button>
                )}
                {factura.pdf_url && (
                  <a href={factura.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline underline-offset-2">
                    Ver PDF oficial de SUNAT
                  </a>
                )}
              </div>
              {factura.estado_sunat === "RECHAZADO" && factura.mensaje_sunat && (
                <p className="text-sm text-destructive">{factura.mensaje_sunat}</p>
              )}
              {factura.estado_sunat === "ANULADO" && (
                <p className="text-sm text-muted-foreground">
                  Comprobante anulado ante SUNAT. Si se generó una Nota de Crédito, puedes verla en Comprobantes.
                </p>
              )}
              {factura.estado_sunat === "ACEPTADO" && (
                <div className="rounded-lg border border-dashed p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Anular este comprobante ante SUNAT. Dentro del plazo se anula directamente; fuera de plazo se
                    genera automáticamente una Nota de Crédito.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="motivo-anulacion" className="text-xs">Motivo (opcional)</Label>
                      <Input
                        id="motivo-anulacion"
                        value={motivoAnulacion}
                        onChange={(e) => setMotivoAnulacion(e.target.value)}
                        placeholder="ANULACIÓN DE OPERACIÓN"
                      />
                    </div>
                    <Button variant="destructive" size="sm" onClick={onAnularFactura} disabled={anulando}>
                      {anulando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                      Anular
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!guia && <p className="text-sm text-muted-foreground">Aún no se generaron documentos para este viaje.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" /> Liquidación de dietas
          </CardTitle>
          <Button size="sm" onClick={onCalcular} disabled={cargando}>
            {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Calcular liquidación
          </Button>
        </CardHeader>
        <CardContent>
          {!liquidacion ? (
            <p className="text-sm text-muted-foreground">
              Calcula la liquidación para ver el detalle de dietas, nocturnidad y rendición de cuentas.
            </p>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Info label="Días / Noches" value={`${liquidacion.dias_viaje} / ${liquidacion.noches_viaje}`} />
              <Info label="Tarifa diaria" value={formatCurrency(liquidacion.tarifa_diaria)} />
              <Info label="Bono nocturno" value={formatCurrency(liquidacion.bono_nocturno)} />
              <Info label="Monto dietas" value={formatCurrency(liquidacion.monto_dietas)} />
              <Info label="Adelantos recibidos" value={formatCurrency(liquidacion.total_adelantos_recibidos)} />
              <Info label="Gastos operativos" value={formatCurrency(liquidacion.total_gastos_operativos)} />
              <Info
                label="Saldo rendición"
                value={`${liquidacion.saldo_rendicion_cuentas >= 0 ? "Devuelve" : "Reembolso"} ${formatCurrency(Math.abs(liquidacion.saldo_rendicion_cuentas))}`}
              />
              <div className="col-span-2 rounded-lg bg-accent p-3 sm:col-span-3">
                <p className="text-xs font-semibold uppercase text-accent-foreground/70">Neto a pagar al chofer</p>
                <p className="text-xl font-bold text-accent-foreground">{formatCurrency(liquidacion.neto_a_pagar_chofer)}</p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" /> Rentabilidad del viaje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!rentabilidad ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Info label="Ingresos netos" value={formatCurrency(rentabilidad.ingresos_netos_flete)} />
              <Info label="Gastos operativos" value={formatCurrency(rentabilidad.total_gastos_operativos)} />
              <Info label="Dietas chofer" value={formatCurrency(rentabilidad.monto_dietas_chofer)} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ganancia neta</p>
                <p
                  className={cn(
                    "mt-0.5 text-sm font-bold",
                    rentabilidad.ganancia_neta >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  {formatCurrency(rentabilidad.ganancia_neta)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
