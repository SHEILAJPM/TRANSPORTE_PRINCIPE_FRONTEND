"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ClientePicker } from "@/components/cotizaciones/cliente-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SelectorUbicacion } from "@/components/ubicacion/selector-ubicacion";
import { useChoferes } from "@/hooks/use-choferes";
import { useCarretas, useTractos } from "@/hooks/use-flota";
import { useViajeActions } from "@/hooks/use-viajes";
import type { Cliente, ModalidadViaje } from "@/types/api";

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
  ingreso_flete_neto: number;
  fecha_salida_programada: string;
  precinto_seguridad: string;
  lugar_verificacion_pesos: string;
}

export default function ActivarViajePage() {
  const router = useRouter();
  const { activar, cargando } = useViajeActions();
  const { data: tractos } = useTractos();
  const { data: carretas } = useCarretas();
  const { data: choferes } = useChoferes();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const modalidad: ModalidadViaje = cliente?.tipo_documento === "DNI" ? "SIN_RUC" : "CON_RUC";

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    if (!cliente) {
      toast.error("Selecciona un cliente para continuar");
      return;
    }
    if (!values.tracto_id || !values.chofer_id) {
      toast.error("Selecciona el tracto y el chofer asignados");
      return;
    }
    if (!values.origen_distrito || !values.destino_distrito) {
      toast.error("Selecciona el departamento, provincia y distrito de origen y destino");
      return;
    }
    try {
      const resultado = await activar({
        cliente_id: cliente.id,
        modalidad,
        tracto_id: values.tracto_id,
        chofer_id: values.chofer_id,
        carreta_id: values.carreta_id || null,
        origen_direccion: values.origen_direccion,
        origen_distrito: values.origen_distrito,
        origen_provincia: values.origen_provincia,
        origen_departamento: values.origen_departamento,
        origen_ubigeo: values.origen_ubigeo || null,
        destino_direccion: values.destino_direccion,
        destino_distrito: values.destino_distrito,
        destino_provincia: values.destino_provincia,
        destino_departamento: values.destino_departamento,
        destino_ubigeo: values.destino_ubigeo || null,
        peso_tm: Number(values.peso_tm),
        ingreso_flete_neto: Number(values.ingreso_flete_neto),
        fecha_salida_programada: new Date(values.fecha_salida_programada).toISOString(),
        precinto_seguridad: values.precinto_seguridad || null,
        lugar_verificacion_pesos: values.lugar_verificacion_pesos || null,
      });
      toast.success(`Viaje ${resultado.viaje.numero} activado: GRE ${resultado.guia_remision.numero} emitida`);
      router.push(`/viajes/${resultado.viaje.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo activar el viaje");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Activación de Viaje</h2>
          <p className="text-sm text-muted-foreground">
            Emite de inmediato la Guía de Remisión y la Constancia de Pesos y Medidas.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modalidad y Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <ClientePicker value={cliente} onChange={setCliente} />
              </div>
              <div className="space-y-1.5">
                <Label>Modalidad</Label>
                <p className="text-sm text-muted-foreground">
                  {!cliente ? (
                    "Se determina automáticamente según el documento del cliente seleccionado."
                  ) : modalidad === "CON_RUC" ? (
                    <>
                      Cliente con <strong className="text-foreground">RUC</strong> — se emitirá{" "}
                      <strong className="text-foreground">Factura</strong>.
                    </>
                  ) : (
                    <>
                      Cliente con <strong className="text-foreground">DNI</strong> — se emitirá{" "}
                      <strong className="text-foreground">Boleta</strong>.
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" /> Unidad y Chofer
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ruta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Origen</p>
                <Input placeholder="Dirección exacta" {...register("origen_direccion", { required: true })} />
                <SelectorUbicacion
                  onChange={(v) => {
                    setValue("origen_departamento", v.departamento, { shouldValidate: true });
                    setValue("origen_provincia", v.provincia, { shouldValidate: true });
                    setValue("origen_distrito", v.distrito, { shouldValidate: true });
                    setValue("origen_ubigeo", v.ubigeo, { shouldValidate: true });
                  }}
                />
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destino</p>
                <Input placeholder="Dirección exacta" {...register("destino_direccion", { required: true })} />
                <SelectorUbicacion
                  onChange={(v) => {
                    setValue("destino_departamento", v.departamento, { shouldValidate: true });
                    setValue("destino_provincia", v.provincia, { shouldValidate: true });
                    setValue("destino_distrito", v.distrito, { shouldValidate: true });
                    setValue("destino_ubigeo", v.ubigeo, { shouldValidate: true });
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                El código UBIGEO se completa automáticamente al elegir el distrito — es obligatorio para emitir la
                Guía de Remisión a SUNAT.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Carga, Flete y Salida</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="peso_tm">Peso (TM)</Label>
                <Input id="peso_tm" type="number" step="0.01" min={0.01} {...register("peso_tm", { required: true, min: 0.01 })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ingreso_flete_neto">Flete (S/)</Label>
                <Input
                  id="ingreso_flete_neto"
                  type="number"
                  step="0.01"
                  min={0.01}
                  {...register("ingreso_flete_neto", { required: true, min: 0.01 })}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="fecha_salida_programada">Fecha y hora de salida</Label>
                <Input
                  id="fecha_salida_programada"
                  type="datetime-local"
                  {...register("fecha_salida_programada", { required: true })}
                />
              </div>
              <div className="col-span-2 space-y-1.5 sm:col-span-2">
                <Label htmlFor="precinto_seguridad">Precinto de seguridad</Label>
                <Input id="precinto_seguridad" placeholder="Opcional" {...register("precinto_seguridad")} />
              </div>
              <div className="col-span-2 space-y-1.5 sm:col-span-2">
                <Label htmlFor="lugar_verificacion_pesos">Lugar de verificación (balanza)</Label>
                <Input id="lugar_verificacion_pesos" placeholder="Opcional" {...register("lugar_verificacion_pesos")} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Button type="submit" size="lg" className="w-full" disabled={cargando}>
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Activar viaje
        </Button>
      </form>
    </div>
  );
}
