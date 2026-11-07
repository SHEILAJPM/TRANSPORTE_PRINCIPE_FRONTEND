"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { FilterX } from "lucide-react";

import { ClientePicker } from "@/components/cotizaciones/cliente-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChoferes } from "@/hooks/use-choferes";
import type { FiltrosComprobantes } from "@/hooks/use-comprobantes";
import type { Cliente, EstadoSunat } from "@/types/api";

const TODOS = "TODOS";

const ESTADOS: { label: string; value: EstadoSunat }[] = [
  { label: "Pendiente", value: "PENDIENTE" },
  { label: "Aceptado", value: "ACEPTADO" },
  { label: "Rechazado", value: "RECHAZADO" },
  { label: "Anulado", value: "ANULADO" },
];

const TIPOS = [
  { label: "Facturas", value: "FACTURA" },
  { label: "Boletas", value: "BOLETA" },
  { label: "Notas de crédito", value: "NOTA_CREDITO" },
] as const;

/** Primer y último día del mes "AAAA-MM". */
export function rangoDelMes(mes: string): { desde: string; hasta: string } {
  const [anio, numero] = mes.split("-").map(Number);
  const ultimoDia = new Date(anio, numero, 0).getDate();
  return { desde: `${mes}-01`, hasta: `${mes}-${String(ultimoDia).padStart(2, "0")}` };
}

export function mesActual(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

interface Props {
  valor: FiltrosComprobantes;
  onChange: (valor: FiltrosComprobantes) => void;
  mostrarTipo?: boolean;
}

export function FiltrosComprobantesBar({ valor, onChange, mostrarTipo = false }: Props) {
  const { data: choferes } = useChoferes(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [mes, setMes] = useState(mesActual());
  const [placa, setPlaca] = useState(valor.placa ?? "");
  const [placaDebounced] = useDebounce(placa, 400);

  useEffect(() => {
    if ((valor.placa ?? "") !== placaDebounced) onChange({ ...valor, placa: placaDebounced || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placaDebounced]);

  function cambiar(cambios: Partial<FiltrosComprobantes>) {
    onChange({ ...valor, ...cambios });
  }

  function elegirMes(nuevo: string) {
    setMes(nuevo);
    cambiar(nuevo ? rangoDelMes(nuevo) : { desde: undefined, hasta: undefined });
  }

  function limpiar() {
    setCliente(null);
    setPlaca("");
    setMes("");
    onChange({});
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="filtro-mes" className="text-xs text-muted-foreground">Mes</Label>
          <Input id="filtro-mes" type="month" value={mes} onChange={(e) => elegirMes(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filtro-desde" className="text-xs text-muted-foreground">Desde</Label>
          <Input
            id="filtro-desde"
            type="date"
            value={valor.desde ?? ""}
            onChange={(e) => {
              setMes("");
              cambiar({ desde: e.target.value || undefined });
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filtro-hasta" className="text-xs text-muted-foreground">Hasta</Label>
          <Input
            id="filtro-hasta"
            type="date"
            value={valor.hasta ?? ""}
            onChange={(e) => {
              setMes("");
              cambiar({ hasta: e.target.value || undefined });
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filtro-placa" className="text-xs text-muted-foreground">Placa</Label>
          <Input id="filtro-placa" placeholder="Tracto o carreta" value={placa} onChange={(e) => setPlaca(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1 lg:col-span-2">
          <Label className="text-xs text-muted-foreground">Cliente</Label>
          <ClientePicker
            value={cliente}
            onChange={(c) => {
              setCliente(c);
              cambiar({ cliente_id: c?.id });
            }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Chofer</Label>
          <Select value={valor.chofer_id ?? TODOS} onValueChange={(v) => cambiar({ chofer_id: v === TODOS ? undefined : v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los choferes</SelectItem>
              {choferes?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombres} {c.apellidos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Estado SUNAT</Label>
          <Select
            value={valor.estado_sunat ?? TODOS}
            onValueChange={(v) => cambiar({ estado_sunat: v === TODOS ? undefined : (v as EstadoSunat) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los estados</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        {mostrarTipo ? (
          <div className="w-full space-y-1 sm:w-56">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select
              value={valor.tipo_documento ?? TODOS}
              onValueChange={(v) =>
                cambiar({ tipo_documento: v === TODOS ? undefined : (v as FiltrosComprobantes["tipo_documento"]) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos los tipos</SelectItem>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <span />
        )}
        <Button type="button" variant="ghost" size="sm" onClick={limpiar}>
          <FilterX className="h-4 w-4" /> Quitar filtros
        </Button>
      </div>
    </div>
  );
}
