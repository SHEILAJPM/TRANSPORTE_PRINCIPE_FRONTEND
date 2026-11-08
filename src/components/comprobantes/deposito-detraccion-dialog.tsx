"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDepositoDetraccion } from "@/hooks/use-comprobantes";
import { cn, formatCurrency } from "@/lib/utils";
import type { DepositanteDetraccion, FacturaListItem } from "@/types/api";

function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const OPCIONES: { valor: DepositanteDetraccion; titulo: string; detalle: string }[] = [
  { valor: "CLIENTE", titulo: "La depositó el cliente", detalle: "Te pagó el neto (total menos la detracción)." },
  { valor: "EMPRESA", titulo: "La deposité yo", detalle: "El cliente te pagó el total y tú depositaste la detracción." },
];

/** Registra la constancia de depósito de la detracción en el Banco de la Nación. */
export function DepositoDetraccionDialog({ factura, onClose }: { factura: FacturaListItem | null; onClose: () => void }) {
  const { registrar, quitar, cargando } = useDepositoDetraccion();
  const [depositante, setDepositante] = useState<DepositanteDetraccion>("CLIENTE");
  const [fecha, setFecha] = useState(hoy());
  const [constancia, setConstancia] = useState("");
  const [monto, setMonto] = useState("");

  useEffect(() => {
    if (!factura) return;
    setDepositante(factura.detraccion_depositada_por ?? "CLIENTE");
    setFecha(factura.detraccion_fecha_deposito ?? hoy());
    setConstancia(factura.detraccion_constancia ?? "");
    setMonto(factura.detraccion_monto != null ? factura.detraccion_monto.toFixed(2) : "");
  }, [factura]);

  if (!factura) return null;
  const depositada = factura.detraccion_estado === "DEPOSITADA";

  async function onGuardar() {
    if (!factura) return;
    if (!constancia.trim()) return toast.error("Escribe el número de la constancia de depósito");
    try {
      await registrar(factura.id, {
        depositada_por: depositante,
        fecha_deposito: fecha,
        numero_constancia: constancia.trim(),
        monto: monto ? Number(monto) : null,
      });
      toast.success(`Detracción de ${factura.serie}-${factura.numero} registrada como depositada`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el depósito");
    }
  }

  async function onQuitar() {
    if (!factura) return;
    try {
      await quitar(factura.id);
      toast.success("La detracción volvió a pendiente");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo quitar el registro");
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Depósito de la detracción</DialogTitle>
          <DialogDescription>
            {factura.serie}-{factura.numero} · {factura.cliente_razon_social} · detracción{" "}
            {formatCurrency(factura.detraccion_monto ?? 0)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {OPCIONES.map((o) => (
              <button
                key={o.valor}
                type="button"
                onClick={() => setDepositante(o.valor)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors",
                  depositante === o.valor ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <span className="block font-medium">{o.titulo}</span>
                <span className="block text-xs text-muted-foreground">{o.detalle}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="det-fecha">Fecha del depósito</Label>
              <Input id="det-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="det-constancia">N.° de constancia</Label>
              <Input id="det-constancia" value={constancia} onChange={(e) => setConstancia(e.target.value)} placeholder="Banco de la Nación" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="det-monto">Monto depositado</Label>
              <Input id="det-monto" type="number" step="0.01" min={0.01} value={monto} onChange={(e) => setMonto(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {depositante === "CLIENTE"
              ? `Debes cobrarle al cliente ${formatCurrency(factura.total - (factura.detraccion_monto ?? 0))} (el neto).`
              : `Debes cobrarle al cliente ${formatCurrency(factura.total)} (el total) y depositar tú la detracción.`}
          </p>
        </div>

        <DialogFooter className="sm:justify-between">
          {depositada ? (
            <Button variant="ghost" className="text-destructive" onClick={onQuitar} disabled={cargando}>
              <Trash2 className="h-4 w-4" /> Volver a pendiente
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={cargando}>
              Cancelar
            </Button>
            <Button onClick={onGuardar} disabled={cargando}>
              {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar depósito
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
