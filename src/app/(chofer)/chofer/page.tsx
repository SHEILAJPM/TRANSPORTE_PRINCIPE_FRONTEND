"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, MapPin, Play, Route, Truck } from "lucide-react";
import { toast } from "sonner";

import { CargaFormMobile } from "@/components/chofer/carga-form-mobile";
import { GastoFormMobile } from "@/components/chofer/gasto-form-mobile";
import { NovedadFormMobile } from "@/components/chofer/novedad-form-mobile";
import { EstadoViajeBadge } from "@/components/viajes/estado-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGastos } from "@/hooks/use-gastos";
import { useViajeActions, useViajes } from "@/hooks/use-viajes";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export default function ChoferHomePage() {
  const usuario = useAuthStore((s) => s.usuario);
  const { data: viajes, isLoading, mutate } = useViajes(usuario?.chofer_id ? { chofer_id: usuario.chofer_id } : undefined);
  const { cambiarEstado, cargando } = useViajeActions();

  const viajeActivo = useMemo(() => {
    if (!viajes) return null;
    const enRuta = viajes.find((v) => v.estado === "EN_RUTA");
    if (enRuta) return enRuta;
    const programados = viajes
      .filter((v) => v.estado === "PROGRAMADO")
      .sort((a, b) => new Date(a.fecha_salida_programada).getTime() - new Date(b.fecha_salida_programada).getTime());
    return programados[0] ?? null;
  }, [viajes]);

  const { data: gastosHoy } = useGastos(viajeActivo?.id ?? null);
  const totalGastosHoy = (gastosHoy ?? []).reduce((acc, g) => acc + g.monto, 0);

  async function iniciarViaje() {
    if (!viajeActivo) return;
    try {
      await cambiarEstado(viajeActivo.id, "EN_RUTA", { fecha_salida_real: new Date().toISOString() });
      toast.success("Viaje iniciado. ¡Buen viaje!");
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar el viaje");
    }
  }

  async function finalizarViaje() {
    if (!viajeActivo) return;
    try {
      await cambiarEstado(viajeActivo.id, "FINALIZADO", { fecha_llegada_real: new Date().toISOString() });
      toast.success("Viaje finalizado. Gracias por tu servicio.");
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo finalizar el viaje");
    }
  }

  if (!usuario?.chofer_id) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Truck className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Tu cuenta no está vinculada a un perfil de chofer. Contacta a tu administrador.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (!viajeActivo) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Route className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No tienes un viaje activo en este momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">{viajeActivo.numero}</p>
              <EstadoViajeBadge estado={viajeActivo.estado} />
            </div>
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {viajeActivo.origen_distrito} → {viajeActivo.destino_distrito}
            </p>
            <p className="text-sm text-muted-foreground">{viajeActivo.cliente?.razon_social ?? ""}</p>
            <p className="text-xs text-muted-foreground">
              Salida programada: {formatDate(viajeActivo.fecha_salida_programada, true)}
            </p>

            {viajeActivo.estado === "PROGRAMADO" && (
              <Button size="lg" className="w-full" onClick={iniciarViaje} disabled={cargando}>
                {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Iniciar viaje
              </Button>
            )}
            {viajeActivo.estado === "EN_RUTA" && (
              <Button size="lg" className="w-full" onClick={finalizarViaje} disabled={cargando}>
                {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Finalizar viaje
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {viajeActivo.estado === "EN_RUTA" && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-3 gap-3"
          >
            <GastoFormMobile viajeId={viajeActivo.id} onRegistrado={() => mutate()} />
            <CargaFormMobile viajeId={viajeActivo.id} />
            <NovedadFormMobile viajeId={viajeActivo.id} onRegistrado={() => mutate()} />
          </motion.div>

          {(gastosHoy?.length ?? 0) > 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-muted-foreground">
              {gastosHoy!.length} gasto(s) registrado(s) · {formatCurrency(totalGastosHoy)}
            </motion.p>
          )}
        </>
      )}
    </div>
  );
}
