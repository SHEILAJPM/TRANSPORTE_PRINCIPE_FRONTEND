"use client";

import { useState } from "react";
import { Fuel, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { enviarOEncolar } from "@/lib/offline-queue";
import { cn } from "@/lib/utils";
import type { TipoGastoViaje } from "@/types/api";

const TIPOS: { value: TipoGastoViaje; label: string }[] = [
  { value: "COMBUSTIBLE", label: "Combustible" },
  { value: "PEAJE", label: "Peaje" },
  { value: "VIATICO", label: "Viático / comida" },
  { value: "ADELANTO", label: "Adelanto recibido" },
  { value: "OTRO", label: "Otro" },
];

interface FormValues {
  monto: number;
  galones?: number;
  grifo_nombre?: string;
  numero_ticket?: string;
  descripcion?: string;
}

export function GastoFormMobile({ viajeId, onRegistrado }: { viajeId: string; onRegistrado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoGastoViaje>("COMBUSTIBLE");
  const [enviando, setEnviando] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    setEnviando(true);
    const uuid = crypto.randomUUID();
    try {
      const { enviado } = await enviarOEncolar({
        uuid_dispositivo: uuid,
        ruta: `/viajes/${viajeId}/gastos`,
        metodo: "post",
        etiqueta: `${TIPOS.find((t) => t.value === tipo)?.label} · S/ ${values.monto}`,
        payload: {
          tipo_gasto: tipo,
          monto: Number(values.monto),
          fecha: new Date().toISOString(),
          galones: values.galones ? Number(values.galones) : null,
          grifo_nombre: values.grifo_nombre || null,
          numero_ticket: values.numero_ticket || null,
          descripcion: values.descripcion || null,
          uuid_dispositivo: uuid,
        },
      });
      toast.success(enviado ? "Gasto registrado" : "Guardado sin conexión — se enviará al reconectar");
      reset();
      setAbierto(false);
      onRegistrado();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el gasto");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center shadow-soft active:scale-[0.97] transition-transform">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Fuel className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold">Combustible y gastos</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
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
          <div className="space-y-1.5">
            <Label htmlFor="monto">Monto (S/)</Label>
            <Input id="monto" type="number" step="0.01" min={0.01} inputMode="decimal" {...register("monto", { required: true, min: 0.01 })} />
          </div>
          {tipo === "COMBUSTIBLE" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="galones">Galones</Label>
                <Input id="galones" type="number" step="0.01" inputMode="decimal" {...register("galones")} />
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
            <Label htmlFor="descripcion">Nota (opcional)</Label>
            <Textarea id="descripcion" rows={2} {...register("descripcion")} />
          </div>
          <DialogFooter>
            <Button type="submit" size="lg" className={cn("w-full")} disabled={enviando}>
              {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
