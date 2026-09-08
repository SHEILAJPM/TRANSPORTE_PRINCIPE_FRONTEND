"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce";
import { CheckCircle2, Loader2, MapPin, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useClientes } from "@/hooks/use-clientes";
import { useSunatAutocompletarCliente } from "@/hooks/use-sunat";
import { cn } from "@/lib/utils";
import type { Cliente } from "@/types/api";

interface ClientePickerProps {
  value: Cliente | null;
  onChange: (cliente: Cliente) => void;
}

export function ClientePicker({ value, onChange }: ClientePickerProps) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [textoDebounced] = useDebounce(busqueda, 300);
  const { data: resultados, isLoading } = useClientes(textoDebounced);
  const { autocompletar, cargando: buscandoSunat } = useSunatAutocompletarCliente();

  const esRuc = /^\d{11}$/.test(busqueda.trim());
  const esDni = /^\d{8}$/.test(busqueda.trim());

  async function buscarEnSunat() {
    try {
      const cliente = await autocompletar(esRuc ? "RUC" : "DNI", busqueda.trim());
      onChange(cliente);
      toast.success(`Cliente autocompletado: ${cliente.razon_social}`);
      setAbierto(false);
      setBusqueda("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo consultar el RUC/DNI");
    }
  }

  if (value) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-accent/40 p-3">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{value.razon_social}</p>
            <p className="text-xs text-muted-foreground">
              {value.tipo_documento} {value.numero_documento}
              {value.distrito ? ` · ${value.distrito}, ${value.provincia}` : ""}
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onChange(null as unknown as Cliente)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground shadow-sm hover:border-primary/50"
        >
          <Search className="h-4 w-4" />
          Buscar cliente por nombre, RUC o DNI…
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="border-b border-border p-2">
          <Input
            autoFocus
            placeholder="Razón social, RUC (11) o DNI (8)…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="max-h-72 overflow-y-auto scrollbar-thin p-1">
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          {!isLoading &&
            resultados?.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                onClick={() => {
                  onChange(cliente);
                  setAbierto(false);
                  setBusqueda("");
                }}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent"
                )}
              >
                <span className="font-medium">{cliente.razon_social}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {cliente.tipo_documento} {cliente.numero_documento}
                  {cliente.distrito && (
                    <>
                      <MapPin className="h-3 w-3" /> {cliente.distrito}
                    </>
                  )}
                </span>
              </button>
            ))}

          {!isLoading && (resultados?.length ?? 0) === 0 && !esRuc && !esDni && busqueda.trim().length > 0 && (
            <p className="px-2.5 py-4 text-center text-xs text-muted-foreground">
              Sin resultados locales. Escribe un RUC (11 dígitos) o DNI (8 dígitos) para buscar en SUNAT.
            </p>
          )}

          {(esRuc || esDni) && (
            <button
              type="button"
              onClick={buscarEnSunat}
              disabled={buscandoSunat}
              className="mt-1 flex w-full items-center gap-2 rounded-md border border-dashed border-primary/40 bg-accent/40 px-2.5 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-accent disabled:opacity-60"
            >
              {buscandoSunat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Autocompletar por {esRuc ? "RUC" : "DNI"} ({busqueda.trim()})
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
