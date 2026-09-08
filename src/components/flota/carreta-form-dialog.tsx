"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useFlotaActions } from "@/hooks/use-flota";
import type { Carreta, TipoCarreta } from "@/types/api";

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

export function CarretaFormDialog({ carreta, trigger }: { carreta?: Carreta; trigger?: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const [tipoCarreta, setTipoCarreta] = useState<TipoCarreta>("SEMIRREMOLQUE");
  const { crearCarreta, actualizarCarreta, cargando } = useFlotaActions();
  const esEdicion = Boolean(carreta);

  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { kilometraje_actual: 0 } });

  useEffect(() => {
    if (abierto && carreta) {
      setTipoCarreta(carreta.tipo_carreta);
      reset({
        placa: carreta.placa,
        marca: carreta.marca ?? "",
        modelo: carreta.modelo ?? "",
        largo_m: carreta.largo_m,
        ancho_m: carreta.ancho_m,
        alto_m: carreta.alto_m,
        configuracion_vehicular: carreta.configuracion_vehicular,
        numero_ejes: carreta.numero_ejes ?? undefined,
        tara_kg: carreta.tara_kg ?? undefined,
        peso_bruto_max_kg: carreta.peso_bruto_max_kg,
        soat_vencimiento: carreta.soat_vencimiento?.slice(0, 10) ?? "",
        citv_vencimiento: carreta.citv_vencimiento?.slice(0, 10) ?? "",
        mtc_habilitacion_vencimiento: carreta.mtc_habilitacion_vencimiento?.slice(0, 10) ?? "",
        tarjeta_unica_circulacion: carreta.tarjeta_unica_circulacion ?? "",
      });
    } else if (abierto) {
      setTipoCarreta("SEMIRREMOLQUE");
      reset({ kilometraje_actual: 0 });
    }
  }, [abierto, carreta, reset]);

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
      if (esEdicion && carreta) {
        await actualizarCarreta(carreta.id, { tipo_carreta: tipoCarreta, marca: values.marca || null, modelo: values.modelo || null, ...dimensiones });
        toast.success("Carreta actualizada");
      } else {
        await crearCarreta({
          placa: values.placa.toUpperCase(),
          tipo_carreta: tipoCarreta,
          marca: values.marca || null,
          modelo: values.modelo || null,
          anio_fabricacion: values.anio_fabricacion ? Number(values.anio_fabricacion) : null,
          kilometraje_actual: Number(values.kilometraje_actual) || 0,
          ...dimensiones,
        });
        toast.success("Carreta registrada");
      }
      setAbierto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la carreta");
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus /> Nueva carreta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar carreta" : "Registrar carreta / semirremolque"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="placa">Placa</Label>
              <Input id="placa" disabled={esEdicion} {...register("placa", { required: !esEdicion })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipoCarreta} onValueChange={(v) => setTipoCarreta(v as TipoCarreta)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMIRREMOLQUE">Semirremolque</SelectItem>
                  <SelectItem value="REMOLQUE">Remolque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" {...register("marca")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" {...register("modelo")} />
            </div>
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
              <Input id="configuracion_vehicular" placeholder="S3, S2…" {...register("configuracion_vehicular", { required: true })} />
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
