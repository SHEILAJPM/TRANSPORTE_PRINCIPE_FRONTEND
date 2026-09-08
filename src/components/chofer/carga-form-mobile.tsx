"use client";

import { useEffect, useState } from "react";
import { Loader2, Scale } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConstanciaPorViaje } from "@/hooks/use-pesos-medidas";
import { enviarOEncolar } from "@/lib/offline-queue";

export function CargaFormMobile({ viajeId }: { viajeId: string }) {
  const [abierto, setAbierto] = useState(false);
  const { data: constancia, isLoading } = useConstanciaPorViaje(abierto ? viajeId : null);
  const [pesoBruto, setPesoBruto] = useState("");
  const [tara, setTara] = useState("");
  const [precinto, setPrecinto] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (constancia) {
      setPesoBruto(String(constancia.peso_bruto_kg));
      setTara(String(constancia.tara_kg));
      setPrecinto(constancia.precinto_seguridad ?? "");
    }
  }, [constancia]);

  async function guardar() {
    if (!constancia) return;
    setEnviando(true);
    try {
      const { enviado } = await enviarOEncolar({
        uuid_dispositivo: crypto.randomUUID(),
        ruta: `/pesos-medidas/${constancia.id}`,
        metodo: "patch",
        etiqueta: `Balanza · ${pesoBruto} kg`,
        payload: { peso_bruto_kg: Number(pesoBruto), tara_kg: Number(tara), precinto_seguridad: precinto || null },
      });
      toast.success(enviado ? "Carga actualizada" : "Guardado sin conexión — se enviará al reconectar");
      setAbierto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la carga");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center shadow-soft active:scale-[0.97] transition-transform">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Scale className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold">Carga y precinto</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Precinto y pesos de balanza</DialogTitle>
        </DialogHeader>
        {isLoading || !constancia ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="precinto">N.° de precinto de seguridad</Label>
              <Input id="precinto" value={precinto} onChange={(e) => setPrecinto(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="peso_bruto">Peso bruto (kg)</Label>
                <Input id="peso_bruto" type="number" step="0.01" inputMode="decimal" value={pesoBruto} onChange={(e) => setPesoBruto(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tara">Tara (kg)</Label>
                <Input id="tara" type="number" step="0.01" inputMode="decimal" value={tara} onChange={(e) => setTara(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button size="lg" className="w-full" onClick={guardar} disabled={enviando}>
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
