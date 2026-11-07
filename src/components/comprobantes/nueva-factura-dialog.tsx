"use client";

import { Receipt, Truck } from "lucide-react";

import { EstadoSunatBadge } from "@/components/viajes/estado-sunat-badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useFacturables } from "@/hooks/use-comprobantes";
import { formatDate } from "@/lib/utils";
import type { ViajeFacturable } from "@/types/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onElegir: (viaje: ViajeFacturable) => void;
}

/** Paso 1 de "Nueva factura": elegir el viaje terminado (o con guía aceptada) a facturar. */
export function NuevaFacturaDialog({ open, onOpenChange, onElegir }: Props) {
  const { data: viajes, isLoading } = useFacturables(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva factura o boleta</DialogTitle>
          <DialogDescription>
            Elige el viaje o la guía a facturar. Aparecen los viajes terminados y los que ya tienen su guía aceptada por
            SUNAT, que todavía no tienen comprobante.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (viajes ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <Receipt className="h-8 w-8 opacity-40" />
            No hay viajes pendientes de facturar. Un viaje aparece aquí cuando se finaliza o cuando su guía es aceptada por
            SUNAT.
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {viajes?.map((v) => (
              <li key={v.viaje_id}>
                <button
                  type="button"
                  onClick={() => onElegir(v)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-medium">
                      <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {v.viaje_numero}
                      {v.guia_remision && <span className="text-sm font-normal text-muted-foreground">· GRE {v.guia_remision}</span>}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {v.cliente_razon_social} · {v.origen_distrito} → {v.destino_distrito} · {formatDate(v.fecha_salida_programada)}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                    {v.estado_viaje === "FINALIZADO" || v.estado_viaje === "LIQUIDADO" ? "Viaje terminado" : "En curso"}
                    {v.guia_estado_sunat && <EstadoSunatBadge estado={v.guia_estado_sunat} />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
