"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Send, ShieldAlert, XCircle } from "lucide-react";
import { getUbigeoData } from "ubigeo-fns";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useGuiaRemisionSunat } from "@/hooks/use-comprobantes";
import type { GuiaRemision, GuiaVistaPrevia, ParteGuia } from "@/types/api";

const TIPO_DOCUMENTO: Record<string, string> = { "6": "RUC", "1": "DNI", "4": "C.E.", "7": "Pasaporte", "0": "Sin doc." };

function lugar(ubigeo: string) {
  const datos = getUbigeoData(ubigeo);
  return datos ? `${datos.district}, ${datos.province}, ${datos.department}` : `UBIGEO ${ubigeo || "—"}`;
}

function parte(p: ParteGuia) {
  return `${p.razon_social} · ${TIPO_DOCUMENTO[p.tipo_documento] ?? p.tipo_documento} ${p.numero_documento}`;
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 py-1.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</dt>
      <dd className="text-sm">{valor}</dd>
    </div>
  );
}

interface Props {
  viajeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmitida: (guia: GuiaRemision) => void;
}

/**
 * SUNAT no tiene entorno de pruebas para la Guía de Remisión: lo que se confirma aquí
 * se emite de verdad. Muestra exactamente lo que se enviará y exige confirmarlo.
 */
export function VistaPreviaGuiaDialog({ viajeId, open, onOpenChange, onEmitida }: Props) {
  const { previsualizar, emitir, cargando } = useGuiaRemisionSunat(viajeId);
  const [vista, setVista] = useState<GuiaVistaPrevia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revisado, setRevisado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVista(null);
    setError(null);
    setRevisado(false);
    previsualizar()
      .then(setVista)
      .catch((e: Error) => setError(e.message));
    // Se vuelve a pedir cada vez que se abre, para revisar siempre los datos actuales.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, viajeId]);

  async function onConfirmar() {
    if (!vista) return;
    try {
      const guia = await emitir(vista.huella);
      onOpenChange(false);
      onEmitida(guia);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo emitir la guía");
    }
  }

  const d = vista?.datos;
  const enviando = cargando === "emitir";

  return (
    <Dialog open={open} onOpenChange={(abierto) => !enviando && onOpenChange(abierto)}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisa la guía antes de enviarla a SUNAT</DialogTitle>
          <DialogDescription>
            Guía de Remisión Transportista{d ? ` ${d.serie}-${d.numero}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            SUNAT no tiene entorno de pruebas para guías de remisión: <strong>al confirmar, la guía se emite de
            verdad</strong> y no se puede anular desde el sistema.
          </p>
        </div>

        {!vista && !error && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {error && (
          <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {vista && d && (
          <div className="space-y-4">
            {vista.errores.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <p className="mb-1 flex items-center gap-1.5 font-semibold">
                  <XCircle className="h-4 w-4" /> Corrige esto antes de emitir
                </p>
                <ul className="list-disc space-y-0.5 pl-5">
                  {vista.errores.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {vista.advertencias.length > 0 && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                <p className="mb-1 flex items-center gap-1.5 font-semibold text-warning">
                  <AlertTriangle className="h-4 w-4" /> Revisa
                </p>
                <ul className="list-disc space-y-0.5 pl-5">
                  {vista.advertencias.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            <dl className="divide-y rounded-lg border px-4">
              <Fila etiqueta="Transportista" valor={`${parte(d.transportista)}${d.registro_mtc ? ` · MTC ${d.registro_mtc}` : ""}`} />
              <Fila etiqueta="Remitente" valor={parte(d.remitente)} />
              <Fila etiqueta="Destinatario" valor={parte(d.destinatario)} />
              <Fila
                etiqueta="Partida"
                valor={
                  <>
                    {d.partida.direccion}
                    <span className="block text-xs text-muted-foreground">{lugar(d.partida.ubigeo)}</span>
                  </>
                }
              />
              <Fila
                etiqueta="Llegada"
                valor={
                  <>
                    {d.llegada.direccion}
                    <span className="block text-xs text-muted-foreground">{lugar(d.llegada.ubigeo)}</span>
                  </>
                }
              />
              <Fila etiqueta="Inicio de traslado" valor={d.fecha_inicio_traslado.split("-").reverse().join("/")} />
              <Fila etiqueta="Peso bruto" valor={`${Number(d.peso_bruto_kg).toLocaleString("es-PE")} kg`} />
              <Fila
                etiqueta="Vehículos"
                valor={[d.vehiculo_principal, ...d.vehiculos_secundarios]
                  .map((v) => `${v.placa}${v.tarjeta_unica_circulacion ? ` (TUC ${v.tarjeta_unica_circulacion})` : " (sin TUC)"}`)
                  .join(" + ")}
              />
              <Fila
                etiqueta="Chofer"
                valor={`${d.conductor.nombres} ${d.conductor.apellidos} · DNI ${d.conductor.dni} · Licencia ${d.conductor.licencia}`}
              />
              {d.documentos_relacionados.map((doc) => (
                <Fila
                  key={`${doc.serie}-${doc.numero}`}
                  etiqueta="Guía del cliente"
                  valor={`${doc.serie}-${doc.numero} · RUC ${doc.ruc_emisor}`}
                />
              ))}
              {d.bienes.length > 0 && (
                <Fila
                  etiqueta="Bienes"
                  valor={
                    <ul className="space-y-0.5">
                      {d.bienes.map((b, i) => (
                        <li key={i}>
                          {Number(b.cantidad).toLocaleString("es-PE")} {b.unidad} — {b.descripcion}
                        </li>
                      ))}
                    </ul>
                  }
                />
              )}
            </dl>

            {vista.xml && (
              <details className="rounded-lg border">
                <summary className="cursor-pointer px-4 py-2 text-sm font-medium">Ver XML que se firmará y enviará</summary>
                <pre className="max-h-72 overflow-auto border-t bg-muted/40 p-3 text-[11px] leading-snug">{vista.xml}</pre>
              </details>
            )}

            {vista.puede_emitir && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="guia-revisada"
                  checked={revisado}
                  onCheckedChange={(v) => setRevisado(v === true)}
                  disabled={enviando}
                />
                <Label htmlFor="guia-revisada" className="text-sm font-normal leading-snug">
                  Revisé los datos y quiero emitir esta guía ante SUNAT.
                </Label>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={onConfirmar} disabled={!vista?.puede_emitir || !revisado || enviando}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {enviando ? "Enviando a SUNAT…" : "Emitir guía a SUNAT"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
