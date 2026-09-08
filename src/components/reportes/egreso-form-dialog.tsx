"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEgresoActions } from "@/hooks/use-egresos";
import type { CategoriaGastoGeneral } from "@/types/api";

export const CATEGORIAS: { value: CategoriaGastoGeneral; label: string }[] = [
  { value: "ALQUILER", label: "Alquiler" },
  { value: "SEGUROS", label: "Seguros" },
  { value: "SUELDOS_ADMINISTRATIVOS", label: "Sueldos administrativos" },
  { value: "SERVICIOS", label: "Servicios (luz, agua, internet…)" },
  { value: "IMPUESTOS_Y_TASAS", label: "Impuestos y tasas" },
  { value: "OTRO", label: "Otro" },
];

interface FormValues {
  descripcion: string;
  monto: number;
  fecha: string;
  proveedor: string;
}

export function EgresoFormDialog() {
  const [abierto, setAbierto] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaGastoGeneral>("OTRO");
  const { crear, cargando } = useEgresoActions();
  const { register, handleSubmit, reset } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    try {
      await crear({
        categoria,
        descripcion: values.descripcion,
        monto: Number(values.monto),
        fecha: values.fecha,
        proveedor: values.proveedor || null,
      });
      toast.success("Egreso registrado");
      reset();
      setCategoria("OTRO");
      setAbierto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el egreso");
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Registrar egreso
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar egreso general</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaGastoGeneral)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" rows={2} placeholder="Ej. Alquiler de oficina, mes de setiembre" {...register("descripcion", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="monto">Monto (S/)</Label>
              <Input id="monto" type="number" step="0.01" min={0.01} {...register("monto", { required: true, min: 0.01 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" {...register("fecha", { required: true })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proveedor">Proveedor (opcional)</Label>
            <Input id="proveedor" {...register("proveedor")} />
          </div>
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
