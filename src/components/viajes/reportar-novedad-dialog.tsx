"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNovedadActions } from "@/hooks/use-novedades";

const TIPOS = ["AVERIA_MECANICA", "DEMORA_EN_RUTA", "ACCIDENTE", "CONTROL_POLICIAL", "CLIMA", "OTRO"] as const;

interface FormValues {
  tipo_novedad: string;
  descripcion: string;
  fecha: string;
}

export function ReportarNovedadDialog({ viajeId }: { viajeId: string }) {
  const [abierto, setAbierto] = useState(false);
  const { reportar, cargando } = useNovedadActions(viajeId);
  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    defaultValues: { tipo_novedad: "OTRO" },
  });

  async function onSubmit(values: FormValues) {
    try {
      await reportar({
        tipo_novedad: values.tipo_novedad,
        descripcion: values.descripcion,
        fecha: new Date(values.fecha).toISOString(),
      });
      toast.success("Novedad reportada");
      reset();
      setAbierto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo reportar la novedad");
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus /> Reportar novedad
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Reportar novedad en ruta
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={watch("tipo_novedad")} onValueChange={(v) => setValue("tipo_novedad", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha y hora</Label>
            <Input id="fecha" type="datetime-local" {...register("fecha", { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" rows={3} {...register("descripcion", { required: true })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando}>
              {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
              Reportar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
