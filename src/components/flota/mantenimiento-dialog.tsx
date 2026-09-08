"use client";

import { useState } from "react";
import { Loader2, Plus, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useFlotaActions, useMantenimientos } from "@/hooks/use-flota";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TipoMantenimiento } from "@/types/api";

interface FormValues {
  descripcion: string;
  kilometraje_actual_registro: number;
  kilometraje_proximo: number;
  fecha_realizado: string;
  costo: number;
  proveedor: string;
}

export function MantenimientoDialog({
  tipo,
  vehiculoId,
  placa,
}: {
  tipo: "tractos" | "carretas";
  vehiculoId: string;
  placa: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [tipoMantenimiento, setTipoMantenimiento] = useState<TipoMantenimiento>("PREVENTIVO");
  const { data: mantenimientos, isLoading } = useMantenimientos(tipo, abierto ? vehiculoId : null);
  const { registrarMantenimiento, cargando } = useFlotaActions();
  const { register, handleSubmit, reset } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    try {
      await registrarMantenimiento(tipo, vehiculoId, {
        tipo_mantenimiento: tipoMantenimiento,
        descripcion: values.descripcion,
        kilometraje_actual_registro: Number(values.kilometraje_actual_registro),
        kilometraje_proximo: values.kilometraje_proximo ? Number(values.kilometraje_proximo) : null,
        fecha_realizado: values.fecha_realizado,
        costo: values.costo ? Number(values.costo) : null,
        proveedor: values.proveedor || null,
        completado: true,
      });
      toast.success("Mantenimiento registrado");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el mantenimiento");
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Wrench className="h-3.5 w-3.5" /> Mantenimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Mantenimiento · {placa}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {isLoading && <Skeleton className="h-16 w-full" />}
          {!isLoading && (mantenimientos ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Sin mantenimientos registrados.</p>
          )}
          {mantenimientos?.map((m) => (
            <div key={m.id} className="rounded-lg border border-border px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.tipo_mantenimiento === "PREVENTIVO" ? "Preventivo" : "Correctivo"}</span>
                <span className="text-xs text-muted-foreground">{formatDate(m.fecha_realizado)}</span>
              </div>
              <p className="text-muted-foreground">{m.descripcion}</p>
              <p className="text-xs text-muted-foreground">
                {m.kilometraje_actual_registro.toLocaleString("es-PE")} km
                {m.costo ? ` · ${formatCurrency(m.costo)}` : ""}
                {m.proveedor ? ` · ${m.proveedor}` : ""}
              </p>
            </div>
          ))}
        </div>

        <Separator />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registrar nuevo</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipoMantenimiento} onValueChange={(v) => setTipoMantenimiento(v as TipoMantenimiento)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PREVENTIVO">Preventivo</SelectItem>
                  <SelectItem value="CORRECTIVO">Correctivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_realizado">Fecha</Label>
              <Input id="fecha_realizado" type="date" {...register("fecha_realizado", { required: true })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" rows={2} {...register("descripcion", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="kilometraje_actual_registro">Kilometraje actual</Label>
              <Input id="kilometraje_actual_registro" type="number" {...register("kilometraje_actual_registro", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kilometraje_proximo">Próximo (opcional)</Label>
              <Input id="kilometraje_proximo" type="number" {...register("kilometraje_proximo")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="costo">Costo (S/)</Label>
              <Input id="costo" type="number" step="0.01" {...register("costo")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Input id="proveedor" {...register("proveedor")} />
            </div>
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={cargando}>
            {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Registrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
