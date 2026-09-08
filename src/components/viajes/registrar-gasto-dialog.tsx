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
import { useGastoActions } from "@/hooks/use-gastos";
import type { TipoGastoViaje } from "@/types/api";

const TIPOS: { value: TipoGastoViaje; label: string }[] = [
  { value: "COMBUSTIBLE", label: "Combustible" },
  { value: "PEAJE", label: "Peaje" },
  { value: "VIATICO", label: "Viático / comida" },
  { value: "ADELANTO", label: "Adelanto de efectivo" },
  { value: "OTRO", label: "Otro" },
];

interface FormValues {
  monto: number;
  fecha: string;
  galones?: number;
  grifo_nombre?: string;
  numero_ticket?: string;
  descripcion?: string;
}

export function RegistrarGastoDialog({ viajeId }: { viajeId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoGastoViaje>("COMBUSTIBLE");
  const { registrar, cargando } = useGastoActions(viajeId);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    try {
      await registrar({
        tipo_gasto: tipo,
        monto: Number(values.monto),
        fecha: new Date(values.fecha).toISOString(),
        galones: values.galones ? Number(values.galones) : null,
        grifo_nombre: values.grifo_nombre || null,
        numero_ticket: values.numero_ticket || null,
        descripcion: values.descripcion || null,
      });
      toast.success("Gasto registrado");
      reset();
      setAbierto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el gasto");
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Registrar gasto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar gasto de viaje</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo de gasto</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoGastoViaje)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="monto">Monto (S/)</Label>
              <Input id="monto" type="number" step="0.01" min={0.01} {...register("monto", { required: true, min: 0.01 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="datetime-local" {...register("fecha", { required: true })} />
            </div>
          </div>
          {tipo === "COMBUSTIBLE" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="galones">Galones</Label>
                <Input id="galones" type="number" step="0.01" {...register("galones")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grifo_nombre">Grifo</Label>
                <Input id="grifo_nombre" {...register("grifo_nombre")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="numero_ticket">N.° de ticket</Label>
                <Input id="numero_ticket" {...register("numero_ticket")} />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea id="descripcion" rows={2} {...register("descripcion")} />
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
