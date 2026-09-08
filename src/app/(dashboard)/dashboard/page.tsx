"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, FileText, Plus, ThumbsUp, Truck } from "lucide-react";

import { EstadoCotizacionBadge } from "@/components/cotizaciones/estado-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlertasVencimiento } from "@/hooks/use-alertas";
import { useCotizaciones } from "@/hooks/use-cotizaciones";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export default function DashboardPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const { data: cotizaciones, isLoading } = useCotizaciones();
  const { data: alertas } = useAlertasVencimiento();

  const enviadas = cotizaciones?.filter((c) => c.estado === "ENVIADA").length ?? 0;
  const aprobadas = cotizaciones?.filter((c) => c.estado === "APROBADA").length ?? 0;
  const convertidas = cotizaciones?.filter((c) => c.estado === "CONVERTIDA").length ?? 0;
  const alertasCriticas = alertas?.filter((a) => a.dias_restantes <= 7).length ?? 0;
  const recientes = cotizaciones?.slice(0, 6) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Hola, {usuario?.nombres} 👋</h2>
          <p className="text-sm text-muted-foreground">Este es el resumen operativo de hoy.</p>
        </div>
        <Button asChild>
          <Link href="/cotizaciones/nueva">
            <Plus />
            Nueva cotización
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Por aprobar" value={enviadas} icon={FileText} tone="warning" hint="Cotizaciones enviadas" delay={0} />
        <StatCard label="Aprobadas" value={aprobadas} icon={ThumbsUp} tone="success" hint="Listas para convertir" delay={0.05} />
        <StatCard label="Convertidas a viaje" value={convertidas} icon={Truck} tone="primary" hint="Con GRE + Constancia emitida" delay={0.1} />
        <StatCard
          label="Alertas críticas"
          value={alertasCriticas}
          icon={AlertTriangle}
          tone={alertasCriticas > 0 ? "warning" : "default"}
          hint="Vencen en 7 días o menos"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Cotizaciones recientes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cotizaciones">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            )}
            {!isLoading && recientes.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay cotizaciones registradas.</p>
            )}
            {recientes.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/cotizaciones/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {c.numero} · {c.cliente?.razon_social ?? "Cliente"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.origen_distrito} → {c.destino_distrito} · {formatDate(c.fecha_emision)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold">{formatCurrency(c.precio_total)}</span>
                    <EstadoCotizacionBadge estado={c.estado} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vencimientos próximos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!alertas && <Skeleton className="h-24 w-full" />}
            {alertas && alertas.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin vencimientos próximos. Todo al día.</p>
            )}
            {alertas?.slice(0, 6).map((a) => (
              <div key={`${a.entidad_id}-${a.concepto}`} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.identificador}</p>
                  <p className="text-xs text-muted-foreground">{a.concepto.replace("_", " ")}</p>
                </div>
                <Badge variant={a.vencido ? "destructive" : a.dias_restantes <= 7 ? "warning" : "outline"}>
                  {a.vencido ? "Vencido" : `${a.dias_restantes} d.`}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
