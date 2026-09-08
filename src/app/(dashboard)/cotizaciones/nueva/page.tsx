"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Receipt, Save, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ClientePicker } from "@/components/cotizaciones/cliente-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SelectorUbicacion } from "@/components/ubicacion/selector-ubicacion";
import { useCotizacionActions } from "@/hooks/use-cotizaciones";
import { cn, formatCurrency } from "@/lib/utils";
import type { Cliente } from "@/types/api";

const PORCENTAJE_IGV_ESTANDAR = 18;

const CONDICIONES_DEFAULT =
  "1. El cliente deberá realizar un adelanto del 50% del valor total del servicio antes de la salida de la unidad.\n" +
  "2. El 50% restante deberá ser cancelado antes de proceder con la descarga en el punto de destino.";

interface FormValues {
  descripcion_servicio: string;
  origen_direccion: string;
  origen_distrito: string;
  origen_provincia: string;
  origen_departamento: string;
  destino_direccion: string;
  destino_distrito: string;
  destino_provincia: string;
  destino_departamento: string;
  cantidad_camiones: number;
  peso_tm: number;
  precio_base: number;
  validez_dias: number;
  condiciones_comerciales: string;
}

export default function NuevaCotizacionPage() {
  const router = useRouter();
  const { crear, cargando } = useCotizacionActions();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [conIgv, setConIgv] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      cantidad_camiones: 1,
      validez_dias: 7,
      condiciones_comerciales: CONDICIONES_DEFAULT,
    },
  });

  const porcentajeIgv = conIgv ? PORCENTAJE_IGV_ESTANDAR : 0;
  const precioBase = Number(watch("precio_base")) || 0;
  const igv = precioBase * (porcentajeIgv / 100);
  const total = precioBase + igv;

  async function onSubmit(values: FormValues) {
    if (!cliente) {
      toast.error("Selecciona un cliente para continuar");
      return;
    }
    if (!values.origen_distrito || !values.destino_distrito) {
      toast.error("Selecciona el departamento, provincia y distrito de origen y destino");
      return;
    }
    try {
      const cotizacion = await crear({
        cliente_id: cliente.id,
        ...values,
        cantidad_camiones: Number(values.cantidad_camiones),
        peso_tm: Number(values.peso_tm),
        precio_base: Number(values.precio_base),
        validez_dias: Number(values.validez_dias),
        porcentaje_igv: porcentajeIgv,
      });
      toast.success(`Cotización ${cotizacion.numero} creada en estado Borrador`);
      router.push(`/cotizaciones/${cotizacion.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la cotización");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Nueva cotización</h2>
          <p className="text-sm text-muted-foreground">Elige si el servicio afecta IGV; el monto se calcula automáticamente sobre el precio base.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cliente y servicio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Cliente</Label>
                  <ClientePicker value={cliente} onChange={setCliente} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="descripcion_servicio">Descripción del servicio</Label>
                  <Textarea
                    id="descripcion_servicio"
                    placeholder="Ej. Transporte de carga general de Lima a Arequipa"
                    {...register("descripcion_servicio", { required: true })}
                  />
                  {errors.descripcion_servicio && <p className="text-xs text-destructive">Describe el servicio a cotizar</p>}
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Origen</p>
                  <Input placeholder="Dirección exacta" {...register("origen_direccion", { required: true })} />
                  <SelectorUbicacion
                    onChange={(v) => {
                      setValue("origen_departamento", v.departamento, { shouldValidate: true });
                      setValue("origen_provincia", v.provincia, { shouldValidate: true });
                      setValue("origen_distrito", v.distrito, { shouldValidate: true });
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
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" /> Camiones, peso y precio
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cantidad_camiones">N.º de camiones</Label>
                  <Input id="cantidad_camiones" type="number" min={1} {...register("cantidad_camiones", { required: true, min: 1 })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="peso_tm">Peso (TM)</Label>
                  <Input id="peso_tm" type="number" step="0.01" min={0.01} {...register("peso_tm", { required: true, min: 0.01 })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="precio_base">Precio base (S/)</Label>
                  <Input id="precio_base" type="number" step="0.01" min={0.01} {...register("precio_base", { required: true, min: 0.01 })} />
                </div>
                <div className="col-span-2 space-y-1.5 sm:col-span-2">
                  <Label>Afectación de IGV</Label>
                  <div className="relative inline-flex w-full rounded-lg bg-muted p-1">
                    {(
                      [
                        { label: "Con IGV (18%)", value: true },
                        { label: "Sin IGV", value: false },
                      ] as const
                    ).map((opcion) => (
                      <button
                        key={String(opcion.value)}
                        type="button"
                        onClick={() => setConIgv(opcion.value)}
                        className={cn(
                          "relative flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                          conIgv === opcion.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {conIgv === opcion.value && (
                          <motion.span
                            layoutId="toggle-igv-activo"
                            className="absolute inset-0 rounded-md bg-background shadow-soft"
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span className="relative z-10">{opcion.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {conIgv
                      ? "Se añadirá 18% de IGV al precio base."
                      : "Servicio exonerado o sin comprobante con IGV: el total es igual al precio base."}
                  </p>
                </div>
                <div className="col-span-2 space-y-1.5 sm:col-span-2">
                  <Label htmlFor="validez_dias">Validez (días)</Label>
                  <Input id="validez_dias" type="number" min={1} {...register("validez_dias", { required: true, min: 1 })} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Condiciones comerciales</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea rows={4} {...register("condiciones_comerciales", { required: true })} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="sticky top-24"
          >
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4 text-primary" /> Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio base</span>
                  <span className="font-medium tabular-nums">{formatCurrency(precioBase)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{conIgv ? `IGV (${PORCENTAJE_IGV_ESTANDAR}%)` : "IGV"}</span>
                  <span className="font-medium tabular-nums">{conIgv ? formatCurrency(igv) : "No aplica"}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <motion.span key={total} initial={{ scale: 1.08 }} animate={{ scale: 1 }} className="tabular-nums text-primary">
                    {formatCurrency(total)}
                  </motion.span>
                </div>

                <Button type="submit" className="mt-4 w-full" size="lg" disabled={cargando}>
                  {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar cotización
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Se creará en estado <span className="font-medium">Borrador</span>.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
