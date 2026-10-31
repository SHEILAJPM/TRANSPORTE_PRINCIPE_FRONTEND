"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, FileUp, Loader2, PenLine, Sparkles, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { getUbigeoData } from "ubigeo-fns";

import { ClientePicker } from "@/components/cotizaciones/cliente-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SelectorUbicacion } from "@/components/ubicacion/selector-ubicacion";
import { useChoferes } from "@/hooks/use-choferes";
import { useCarretas, useTractos } from "@/hooks/use-flota";
import { importarGuiaRemitente, useViajeActions } from "@/hooks/use-viajes";
import type { BienGuia, Cliente, GuiaRemitenteImportada } from "@/types/api";

interface FormValues {
  tracto_id: string;
  carreta_id: string;
  chofer_id: string;
  origen_direccion: string;
  origen_distrito: string;
  origen_provincia: string;
  origen_departamento: string;
  origen_ubigeo: string;
  destino_direccion: string;
  destino_distrito: string;
  destino_provincia: string;
  destino_departamento: string;
  destino_ubigeo: string;
  peso_tm: number;
  numero_bultos: string;
  fecha_salida_programada: string;
  descripcion_carga: string;
  precinto_seguridad: string;
  lugar_verificacion_pesos: string;
  destinatario_tipo_documento: string;
  destinatario_numero_documento: string;
  destinatario_razon_social: string;
}

type Origen = "con-guia" | "manual";

const CODIGO_DOCUMENTO = { RUC: "6", DNI: "1" } as const;

function nombresUbigeo(ubigeo: string | null) {
  const datos = ubigeo ? getUbigeoData(ubigeo) : null;
  return {
    departamento: datos?.department ?? "",
    provincia: datos?.province ?? "",
    distrito: datos?.district ?? "",
    ubigeo: datos ? ubigeo! : "",
  };
}

export default function ActivarViajePage() {
  const router = useRouter();
  const { activar, cargando } = useViajeActions();
  const { data: tractos } = useTractos();
  const { data: carretas } = useCarretas();
  const { data: choferes } = useChoferes();

  const [origen, setOrigen] = useState<Origen | null>(null);
  const [guia, setGuia] = useState<GuiaRemitenteImportada | null>(null);
  const [importando, setImportando] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [destinatarioEsCliente, setDestinatarioEsCliente] = useState(true);
  const [bienes, setBienes] = useState<BienGuia[]>([]);
  // Cambia al importar una guía para remontar los selectores de ubicación con el UBIGEO leído.
  const [versionUbicacion, setVersionUbicacion] = useState(0);
  const archivoRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    defaultValues: { destinatario_tipo_documento: "6" },
  });

  function elegirOrigen(valor: Origen) {
    setOrigen(valor);
    setGuia(null);
    setCliente(null);
    setBienes([]);
    setDestinatarioEsCliente(valor === "manual");
    reset({ destinatario_tipo_documento: "6" });
    setVersionUbicacion((v) => v + 1);
  }

  async function onArchivoGuia(archivo: File | undefined) {
    if (!archivo) return;
    setImportando(true);
    try {
      const datos = await importarGuiaRemitente(archivo);
      const partida = nombresUbigeo(datos.origen.ubigeo);
      const llegada = nombresUbigeo(datos.destino.ubigeo);
      reset({
        origen_direccion: datos.origen.direccion ?? "",
        origen_departamento: partida.departamento,
        origen_provincia: partida.provincia,
        origen_distrito: partida.distrito,
        origen_ubigeo: partida.ubigeo,
        destino_direccion: datos.destino.direccion ?? "",
        destino_departamento: llegada.departamento,
        destino_provincia: llegada.provincia,
        destino_distrito: llegada.distrito,
        destino_ubigeo: llegada.ubigeo,
        peso_tm: datos.peso_tm ?? undefined,
        numero_bultos: datos.numero_bultos ? String(datos.numero_bultos) : "",
        fecha_salida_programada: datos.fecha_inicio_traslado ? `${datos.fecha_inicio_traslado}T08:00` : "",
        destinatario_tipo_documento: datos.destinatario?.tipo_documento ?? "6",
        destinatario_numero_documento: datos.destinatario?.numero_documento ?? "",
        destinatario_razon_social: datos.destinatario?.razon_social ?? "",
      });
      setGuia(datos);
      setCliente(datos.cliente);
      setBienes(datos.bienes);
      setDestinatarioEsCliente(false);
      setVersionUbicacion((v) => v + 1);
      toast.success(`Guía ${datos.remitente_guia_serie}-${datos.remitente_guia_numero} leída: revisa los datos`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo leer la guía del cliente");
    } finally {
      setImportando(false);
      if (archivoRef.current) archivoRef.current.value = "";
    }
  }

  async function onSubmit(values: FormValues) {
    if (!cliente) {
      toast.error(origen === "con-guia" ? "Sube primero la guía del cliente" : "Selecciona un cliente para continuar");
      return;
    }
    if (!values.origen_ubigeo || !values.destino_ubigeo) {
      toast.error("Selecciona el departamento, provincia y distrito de origen y destino");
      return;
    }
    if (!values.tracto_id || !values.chofer_id) {
      toast.error("Elige el camión (tracto) y el chofer");
      return;
    }
    const destinatario = destinatarioEsCliente
      ? {
          destinatario_tipo_documento: CODIGO_DOCUMENTO[cliente.tipo_documento],
          destinatario_numero_documento: cliente.numero_documento,
          destinatario_razon_social: cliente.razon_social,
        }
      : {
          destinatario_tipo_documento: values.destinatario_tipo_documento,
          destinatario_numero_documento: values.destinatario_numero_documento.trim(),
          destinatario_razon_social: values.destinatario_razon_social.trim(),
        };
    if (!destinatario.destinatario_numero_documento || !destinatario.destinatario_razon_social) {
      toast.error("Completa el documento y el nombre del destinatario");
      return;
    }
    const bienesFinales =
      bienes.length > 0
        ? bienes
        : values.descripcion_carga?.trim()
          ? [{ descripcion: values.descripcion_carga.trim(), cantidad: 1, unidad: "NIU", codigo: null }]
          : null;

    try {
      const resultado = await activar({
        cliente_id: cliente.id,
        tracto_id: values.tracto_id,
        chofer_id: values.chofer_id,
        carreta_id: values.carreta_id || null,
        origen_direccion: values.origen_direccion,
        origen_distrito: values.origen_distrito,
        origen_provincia: values.origen_provincia,
        origen_departamento: values.origen_departamento,
        origen_ubigeo: values.origen_ubigeo,
        destino_direccion: values.destino_direccion,
        destino_distrito: values.destino_distrito,
        destino_provincia: values.destino_provincia,
        destino_departamento: values.destino_departamento,
        destino_ubigeo: values.destino_ubigeo,
        peso_tm: Number(values.peso_tm),
        numero_bultos: values.numero_bultos ? Number(values.numero_bultos) : null,
        fecha_salida_programada: new Date(values.fecha_salida_programada).toISOString(),
        precinto_seguridad: values.precinto_seguridad || null,
        lugar_verificacion_pesos: values.lugar_verificacion_pesos || null,
        motivo_traslado: guia?.motivo_traslado ?? null,
        remitente_guia_ruc_emisor: guia?.remitente_guia_ruc_emisor ?? null,
        remitente_guia_serie: guia?.remitente_guia_serie ?? null,
        remitente_guia_numero: guia?.remitente_guia_numero ?? null,
        bienes: bienesFinales,
        ...destinatario,
      });
      toast.success(`Viaje ${resultado.viaje.numero} creado: revisa la guía antes de enviarla a SUNAT`);
      router.push(`/viajes/${resultado.viaje.id}?tab=liquidacion&emitir=guia`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo activar el viaje");
    }
  }

  const listoParaFormulario = origen === "manual" || (origen === "con-guia" && guia !== null);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Activación de Viaje</h2>
          <p className="text-sm text-muted-foreground">
            Genera la Guía de Remisión Transportista y la Constancia de Pesos y Medidas.
          </p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿La empresa te dio su guía?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                size="lg"
                variant={origen === "con-guia" ? "default" : "outline"}
                className="h-auto flex-col gap-1 py-4"
                onClick={() => elegirOrigen("con-guia")}
              >
                <span className="flex items-center gap-2 text-base">
                  <FileUp className="h-5 w-5" /> Sí
                </span>
                <span className="text-xs font-normal opacity-80">Subo el XML de su guía y se llenan los datos</span>
              </Button>
              <Button
                type="button"
                size="lg"
                variant={origen === "manual" ? "default" : "outline"}
                className="h-auto flex-col gap-1 py-4"
                onClick={() => elegirOrigen("manual")}
              >
                <span className="flex items-center gap-2 text-base">
                  <PenLine className="h-5 w-5" /> No
                </span>
                <span className="text-xs font-normal opacity-80">Lleno los datos a mano</span>
              </Button>
            </div>

            {origen === "con-guia" && (
              <div className="space-y-3 rounded-lg border border-dashed p-4">
                <Label htmlFor="archivo-guia">XML de la Guía de Remisión Remitente del cliente</Label>
                <Input
                  id="archivo-guia"
                  ref={archivoRef}
                  type="file"
                  accept=".xml,text/xml,application/xml"
                  disabled={importando}
                  onChange={(e) => onArchivoGuia(e.target.files?.[0])}
                />
                {importando && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Leyendo la guía…
                  </p>
                )}
                {guia && (
                  <p className="text-sm">
                    Guía <strong>{guia.remitente_guia_serie}-{guia.remitente_guia_numero}</strong> de{" "}
                    <strong>{guia.cliente.razon_social}</strong>
                    {guia.motivo_traslado ? ` · Motivo: ${guia.motivo_traslado}` : ""}
                  </p>
                )}
                {guia && guia.advertencias.length > 0 && (
                  <ul className="space-y-1 rounded-md bg-warning/10 p-3 text-sm">
                    {guia.advertencias.map((a) => (
                      <li key={a} className="flex gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> {a}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {listoParaFormulario && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cliente y destinatario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Cliente (quien te contrata)</Label>
                  {origen === "con-guia" && cliente ? (
                    <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      {cliente.razon_social} · {cliente.tipo_documento} {cliente.numero_documento}
                      <span className="block text-xs text-muted-foreground">Remitente de la guía del cliente</span>
                    </p>
                  ) : (
                    <ClientePicker value={cliente} onChange={setCliente} />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="destinatario-es-cliente"
                      checked={destinatarioEsCliente}
                      onCheckedChange={(v) => setDestinatarioEsCliente(v === true)}
                    />
                    <Label htmlFor="destinatario-es-cliente" className="font-normal">
                      La carga la recibe el mismo cliente
                    </Label>
                  </div>
                  {!destinatarioEsCliente && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_10rem_1fr]">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Documento</Label>
                        <Select
                          value={watch("destinatario_tipo_documento")}
                          onValueChange={(v) => setValue("destinatario_tipo_documento", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6">RUC</SelectItem>
                            <SelectItem value="1">DNI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="destinatario-numero" className="text-xs text-muted-foreground">Número</Label>
                        <Input id="destinatario-numero" inputMode="numeric" {...register("destinatario_numero_documento")} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="destinatario-nombre" className="text-xs text-muted-foreground">
                          Razón social o nombre del destinatario
                        </Label>
                        <Input id="destinatario-nombre" {...register("destinatario_razon_social")} />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ruta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Punto de partida</p>
                  <Input placeholder="Dirección exacta" {...register("origen_direccion", { required: true })} />
                  <SelectorUbicacion
                    key={`origen-${versionUbicacion}`}
                    ubigeoInicial={watch("origen_ubigeo")}
                    onChange={(v) => {
                      setValue("origen_departamento", v.departamento);
                      setValue("origen_provincia", v.provincia);
                      setValue("origen_distrito", v.distrito);
                      setValue("origen_ubigeo", v.ubigeo);
                    }}
                  />
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Punto de llegada</p>
                  <Input placeholder="Dirección exacta" {...register("destino_direccion", { required: true })} />
                  <SelectorUbicacion
                    key={`destino-${versionUbicacion}`}
                    ubigeoInicial={watch("destino_ubigeo")}
                    onChange={(v) => {
                      setValue("destino_departamento", v.departamento);
                      setValue("destino_provincia", v.provincia);
                      setValue("destino_distrito", v.distrito);
                      setValue("destino_ubigeo", v.ubigeo);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Carga y salida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="peso_tm">Peso bruto (TM)</Label>
                    <Input id="peso_tm" type="number" step="0.001" min={0.001} {...register("peso_tm", { required: true, min: 0.001 })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="numero_bultos">Bultos</Label>
                    <Input id="numero_bultos" type="number" min={1} placeholder="Opcional" {...register("numero_bultos")} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="fecha_salida_programada">Fecha y hora de salida</Label>
                    <Input id="fecha_salida_programada" type="datetime-local" {...register("fecha_salida_programada", { required: true })} />
                  </div>
                </div>

                {bienes.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label>Bienes (de la guía del cliente)</Label>
                    <ul className="divide-y rounded-md border text-sm">
                      {bienes.map((b, i) => (
                        <li key={i} className="flex justify-between gap-3 px-3 py-2">
                          <span>{b.descripcion}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {b.cantidad.toLocaleString("es-PE")} {b.unidad}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="descripcion_carga">Descripción de la carga</Label>
                    <Input id="descripcion_carga" placeholder="p.ej. 570 bolsas de cemento tipo I" {...register("descripcion_carga")} />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="precinto_seguridad">Precinto de seguridad</Label>
                    <Input id="precinto_seguridad" placeholder="Opcional" {...register("precinto_seguridad")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lugar_verificacion_pesos">Lugar de verificación (balanza)</Label>
                    <Input id="lugar_verificacion_pesos" placeholder="Opcional" {...register("lugar_verificacion_pesos")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" /> Camión y chofer
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Tracto</Label>
                  <Select value={watch("tracto_id")} onValueChange={(v) => setValue("tracto_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tracto" />
                    </SelectTrigger>
                    <SelectContent>
                      {tractos?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.placa} · {t.marca}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Carreta (opcional)</Label>
                  <Select value={watch("carreta_id") || undefined} onValueChange={(v) => setValue("carreta_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin carreta" />
                    </SelectTrigger>
                    <SelectContent>
                      {carretas?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.placa} · {c.tipo_carreta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Chofer</Label>
                  <Select value={watch("chofer_id")} onValueChange={(v) => setValue("chofer_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un chofer" />
                    </SelectTrigger>
                    <SelectContent>
                      {choferes?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombres} {c.apellidos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Button type="submit" size="lg" className="w-full" disabled={cargando}>
            {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Activar viaje y revisar la guía
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Antes de enviar la guía a SUNAT verás una vista previa para confirmarla.
          </p>
        </form>
      )}
    </div>
  );
}
