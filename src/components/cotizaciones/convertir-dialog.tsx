"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles, Truck } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCarretas, useTractos } from "@/hooks/use-flota";
import { useChoferes } from "@/hooks/use-choferes";
import { type AsignacionUnidadPayload, useCotizacionActions } from "@/hooks/use-cotizaciones";
import type { Cotizacion, ModalidadViaje, ResultadoConversion } from "@/types/api";

interface FormValues {
  origen_ubigeo: string;
  destino_ubigeo: string;
  asignaciones: (AsignacionUnidadPayload & { carreta_id?: string })[];
}

export function ConvertirCotizacionDialog({
  cotizacion,
  open,
  onOpenChange,
  onConvertida,
}: {
  cotizacion: Cotizacion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertida: (resultados: ResultadoConversion[]) => void;
}) {
  const { data: tractos } = useTractos();
  const { data: carretas } = useCarretas();
  const { data: choferes } = useChoferes();
  const { convertirAViaje, cargando } = useCotizacionActions();

  const modalidad: ModalidadViaje = cotizacion.cliente?.tipo_documento === "DNI" ? "SIN_RUC" : "CON_RUC";

  const { register, control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      asignaciones: Array.from({ length: cotizacion.cantidad_camiones }, () => ({
        tracto_id: "",
        chofer_id: "",
        carreta_id: "",
        fecha_salida_programada: "",
        precinto_seguridad: "",
        lugar_verificacion_pesos: "",
      })),
    },
  });
  const { fields } = useFieldArray({ control, name: "asignaciones" });

  useEffect(() => {
    if (open) {
      reset({
        asignaciones: Array.from({ length: cotizacion.cantidad_camiones }, () => ({
          tracto_id: "",
          chofer_id: "",
          carreta_id: "",
          fecha_salida_programada: "",
          precinto_seguridad: "",
          lugar_verificacion_pesos: "",
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cotizacion.id]);

  async function onSubmit(values: FormValues) {
    try {
      const asignaciones = values.asignaciones.map((a) => ({
        tracto_id: a.tracto_id,
        chofer_id: a.chofer_id,
        carreta_id: a.carreta_id || null,
        fecha_salida_programada: new Date(a.fecha_salida_programada).toISOString(),
        precinto_seguridad: a.precinto_seguridad || null,
        lugar_verificacion_pesos: a.lugar_verificacion_pesos || null,
        origen_ubigeo: values.origen_ubigeo || null,
        destino_ubigeo: values.destino_ubigeo || null,
      }));
      const resultados = await convertirAViaje(cotizacion.id, modalidad, asignaciones);
      const nombreComprobante = modalidad === "CON_RUC" ? "Factura" : "Boleta";
      toast.success(`Cotización convertida: Viaje, GRE, ${nombreComprobante} y Constancia generados`, {
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
      onConvertida(resultados);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo convertir la cotización");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Conversión de 1 clic a Viaje
          </DialogTitle>
          <DialogDescription>
            Asigna camión, chofer y fecha de salida por cada unidad. Se generarán automáticamente la Guía de
            Remisión y la Constancia de Pesos y Medidas{sufijoUnidades(cotizacion)}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label>Modalidad</Label>
            <p className="text-sm text-muted-foreground">
              {modalidad === "CON_RUC" ? (
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="origen_ubigeo">UBIGEO origen</Label>
              <Input id="origen_ubigeo" placeholder="6 dígitos" maxLength={6} {...register("origen_ubigeo")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destino_ubigeo">UBIGEO destino</Label>
              <Input id="destino_ubigeo" placeholder="6 dígitos" maxLength={6} {...register("destino_ubigeo")} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Código UBIGEO (INEI) de {cotizacion.origen_distrito} y {cotizacion.destino_distrito} — obligatorio para
            emitir la Guía de Remisión a SUNAT, opcional para la conversión en sí.
          </p>

          <Separator />

          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-3 rounded-lg border border-border p-4"
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4 text-primary" /> Unidad {index + 1} de {cotizacion.cantidad_camiones}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Camión</Label>
                  <Select
                    value={watch(`asignaciones.${index}.tracto_id`)}
                    onValueChange={(v) => setValue(`asignaciones.${index}.tracto_id`, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un camión" />
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
                  <Select
                    value={watch(`asignaciones.${index}.carreta_id`) || undefined}
                    onValueChange={(v) => setValue(`asignaciones.${index}.carreta_id`, v)}
                  >
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
                  <Select
                    value={watch(`asignaciones.${index}.chofer_id`)}
                    onValueChange={(v) => setValue(`asignaciones.${index}.chofer_id`, v)}
                  >
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
                <div className="space-y-1.5">
                  <Label>Fecha y hora de salida</Label>
                  <Input type="datetime-local" {...register(`asignaciones.${index}.fecha_salida_programada`, { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Precinto de seguridad</Label>
                  <Input placeholder="Opcional" {...register(`asignaciones.${index}.precinto_seguridad`)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Lugar de verificación (balanza)</Label>
                  <Input placeholder="Opcional" {...register(`asignaciones.${index}.lugar_verificacion_pesos`)} />
                </div>
              </div>
            </motion.div>
          ))}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando}>
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Convertir a viaje
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function sufijoUnidades(cotizacion: Cotizacion) {
  return cotizacion.cantidad_camiones > 1 ? ` para las ${cotizacion.cantidad_camiones} unidades` : "";
}
