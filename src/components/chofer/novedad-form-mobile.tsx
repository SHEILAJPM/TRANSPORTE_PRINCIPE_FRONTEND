"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { enviarOEncolar } from "@/lib/offline-queue";

const TIPOS = ["AVERIA_MECANICA", "DEMORA_EN_RUTA", "ACCIDENTE", "CONTROL_POLICIAL", "CLIMA", "OTRO"] as const;

interface FormValues {
  descripcion: string;
}

export function NovedadFormMobile({ viajeId, onRegistrado }: { viajeId: string; onRegistrado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<string>("OTRO");
  const [enviando, setEnviando] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  function obtenerUbicacion(): Promise<{ lat: number | null; lng: number | null }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { timeout: 3000 }
      );
    });
  }

  async function onSubmit(values: FormValues) {
    setEnviando(true);
    const uuid = crypto.randomUUID();
    try {
      const ubicacion = await obtenerUbicacion();
      const { enviado } = await enviarOEncolar({
        uuid_dispositivo: uuid,
        ruta: `/viajes/${viajeId}/novedades`,
        metodo: "post",
        etiqueta: `${tipo.replace(/_/g, " ")}`,
        payload: {
          tipo_novedad: tipo,
          descripcion: values.descripcion,
          fecha: new Date().toISOString(),
          latitud: ubicacion.lat,
          longitud: ubicacion.lng,
          uuid_dispositivo: uuid,
        },
      });
      toast.success(enviado ? "Novedad reportada" : "Guardada sin conexión — se enviará al reconectar");
      reset();
      setAbierto(false);
      onRegistrado();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo reportar la novedad");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center shadow-soft active:scale-[0.97] transition-transform">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold">Reportar novedad</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar novedad en ruta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
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
            <Label htmlFor="descripcion">¿Qué pasó?</Label>
            <Textarea id="descripcion" rows={4} {...register("descripcion", { required: true })} />
          </div>
          <DialogFooter>
            <Button type="submit" size="lg" className="w-full" disabled={enviando}>
              {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
              Reportar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
