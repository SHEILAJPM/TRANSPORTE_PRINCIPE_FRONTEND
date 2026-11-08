"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useFlotaActions } from "@/hooks/use-flota";
import type { Tracto } from "@/types/api";

interface FormValues {
  placa: string;
  marca: string;
  modelo: string;
  anio_fabricacion: number;
  largo_m: number;
  ancho_m: number;
  alto_m: number;
  configuracion_vehicular: string;
  numero_ejes: number;
  tara_kg: number;
  peso_bruto_max_kg: number;
  kilometraje_actual: number;
  soat_vencimiento: string;
  citv_vencimiento: string;
  mtc_habilitacion_vencimiento: string;
  tarjeta_unica_circulacion: string;
}

export function TractoFormDialog({ tracto, trigger }: { tracto?: Tracto; trigger?: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const { crearTracto, actualizarTracto, cargando } = useFlotaActions();
  const esEdicion = Boolean(tracto);

  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { kilometraje_actual: 0 } });

  useEffect(() => {
    if (abierto && tracto) {
      reset({
        placa: tracto.placa,
        marca: tracto.marca,
        modelo: tracto.modelo ?? "",
        largo_m: tracto.largo_m,
        ancho_m: tracto.ancho_m,
        alto_m: tracto.alto_m,
        configuracion_vehicular: tracto.configuracion_vehicular,
        numero_ejes: tracto.numero_ejes ?? undefined,
        tara_kg: tracto.tara_kg ?? undefined,
        peso_bruto_max_kg: tracto.peso_bruto_max_kg,
        soat_vencimiento: tracto.soat_vencimiento?.slice(0, 10) ?? "",
        citv_vencimiento: tracto.citv_vencimiento?.slice(0, 10) ?? "",
        mtc_habilitacion_vencimiento: tracto.mtc_habilitacion_vencimiento?.slice(0, 10) ?? "",
        tarjeta_unica_circulacion: tracto.tarjeta_unica_circulacion ?? "",
      });
    } else if (abierto) {
      reset({ kilometraje_actual: 0 });
    }
  }, [abierto, tracto, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const dimensiones = {
        largo_m: Number(values.largo_m),
        ancho_m: Number(values.ancho_m),
        alto_m: Number(values.alto_m),
        configuracion_vehicular: values.configuracion_vehicular,
        numero_ejes: values.numero_ejes ? Number(values.numero_ejes) : null,
        tara_kg: values.tara_kg ? Number(values.tara_kg) : null,
        peso_bruto_max_kg: Number(values.peso_bruto_max_kg),
        soat_vencimiento: values.soat_vencimiento || null,
        citv_vencimiento: values.citv_vencimiento || null,
        mtc_habilitacion_vencimiento: values.mtc_habilitacion_vencimiento || null,
        tarjeta_unica_circulacion: values.tarjeta_unica_circulacion || null,
      };
      if (esEdicion && tracto) {
        await actualizarTracto(tracto.id, {
          marca: values.marca,
          modelo: values.modelo || null,
          ...dimensiones,
        });
        toast.success("Camión actualizado");
      } else {
        await crearTracto({
          placa: values.placa.toUpperCase(),
          marca: values.marca,
          modelo: values.modelo || null,
          anio_fabricacion: values.anio_fabricacion ? Number(values.anio_fabricacion) : null,
          kilometraje_actual: Number(values.kilometraje_actual) || 0,
          ...dimensiones,
        });
        toast.success("Camión registrado");
      }
      setAbierto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el camión");
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus /> Nuevo camión
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar camión" : "Registrar camión"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="placa">Placa</Label>
              <Input id="placa" disabled={esEdicion} {...register("placa", { required: !esEdicion })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" {...register("marca", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" {...register("modelo")} />
            </div>
            {!esEdicion && (
              <div className="space-y-1.5">
                <Label htmlFor="anio_fabricacion">Año de fabricación</Label>
                <Input id="anio_fabricacion" type="number" {...register("anio_fabricacion")} />
              </div>
            )}
          </div>

          <Separator />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dimensiones y peso (Anexo IV RNV — DS 058-2003-MTC)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="largo_m">Largo (m)</Label>
              <Input id="largo_m" type="number" step="0.01" {...register("largo_m", { required: true, min: 0.01 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ancho_m">Ancho (m)</Label>
              <Input id="ancho_m" type="number" step="0.01" {...register("ancho_m", { required: true, min: 0.01 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alto_m">Alto (m)</Label>
              <Input id="alto_m" type="number" step="0.01" {...register("alto_m", { required: true, min: 0.01 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="configuracion_vehicular">Configuración</Label>
              <Input id="configuracion_vehicular" placeholder="C-2, C-3, T3S3…" {...register("configuracion_vehicular", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numero_ejes">N.° de ejes</Label>
              <Input id="numero_ejes" type="number" {...register("numero_ejes")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tara_kg">Tara (kg)</Label>
              <Input id="tara_kg" type="number" step="0.01" {...register("tara_kg")} />
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label htmlFor="peso_bruto_max_kg">Peso Bruto Vehicular Máximo Permitido (kg)</Label>
              <Input id="peso_bruto_max_kg" type="number" step="0.01" {...register("peso_bruto_max_kg", { required: true, min: 1 })} />
            </div>
          </div>

          <Separator />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vencimientos</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="soat_vencimiento">SOAT</Label>
              <Input id="soat_vencimiento" type="date" {...register("soat_vencimiento")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="citv_vencimiento">CITV</Label>
              <Input id="citv_vencimiento" type="date" {...register("citv_vencimiento")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mtc_habilitacion_vencimiento">Habilitación MTC</Label>
              <Input id="mtc_habilitacion_vencimiento" type="date" {...register("mtc_habilitacion_vencimiento")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tarjeta_unica_circulacion">Tarjeta Única de Circulación (TUC)</Label>
            <Input id="tarjeta_unica_circulacion" {...register("tarjeta_unica_circulacion")} />
          </div>
          {!esEdicion && (
            <div className="space-y-1.5">
              <Label htmlFor="kilometraje_actual">Kilometraje actual</Label>
              <Input id="kilometraje_actual" type="number" {...register("kilometraje_actual")} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando}>
              {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
