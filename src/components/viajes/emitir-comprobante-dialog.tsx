"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";

import { EstadoSunatBadge } from "@/components/viajes/estado-sunat-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useComprobanteViaje } from "@/hooks/use-comprobantes";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  ComprobanteBorrador,
  ComprobanteVistaPrevia,
  EntradaComprobante,
  Factura,
  ReceptorComprobante,
  TipoComprobanteVenta,
} from "@/types/api";

const NOMBRE_TIPO: Record<TipoComprobanteVenta, string> = {
  FACTURA: "Factura",
  BOLETA: "Boleta",
};
const NOMBRE_DOCUMENTO: Record<string, string> = {
  "6": "RUC",
  "1": "DNI",
  "0": "Sin documento",
};

/** Mismo cálculo que el backend (ROUND_HALF_UP a céntimos), solo para mostrarlo mientras se escribe. */
function calcular(precio: number, incluyeIgv: boolean, porcentaje: number) {
  const centimos = Math.round(precio * 100);
  if (incluyeIgv) {
    const base = Math.round((centimos * 100) / (100 + porcentaje));
    return {
      base: base / 100,
      igv: (centimos - base) / 100,
      total: centimos / 100,
    };
  }
  const igv = Math.round((centimos * porcentaje) / 100);
  return {
    base: centimos / 100,
    igv: igv / 100,
    total: (centimos + igv) / 100,
  };
}

function Avisos({
  errores,
  advertencias,
}: {
  errores: string[];
  advertencias: string[];
}) {
  return (
    <>
      {errores.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {errores.map((e) => (
            <li key={e} className="flex gap-2">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {e}
            </li>
          ))}
        </ul>
      )}
      {advertencias.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          {advertencias.map((a) => (
            <li key={a} className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{" "}
              {a}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

interface DetraccionMostrada {
  porcentaje: number;
  monto: number;
  neto: number;
  cuenta: string | null;
}

/** Igual que el backend: 4 % del total, solo facturas de más de S/ 400, en soles enteros. */
function calcularDetraccion(
  tipo: TipoComprobanteVenta,
  total: number,
  b: ComprobanteBorrador,
): DetraccionMostrada | null {
  if (tipo !== "FACTURA" || total <= b.monto_minimo_detraccion) return null;
  const monto = Math.round((total * b.porcentaje_detraccion) / 100);
  return {
    porcentaje: b.porcentaje_detraccion,
    monto,
    neto: Math.round((total - monto) * 100) / 100,
    cuenta: b.cuenta_detracciones,
  };
}

function Totales({
  base,
  igv,
  total,
  porcentaje,
  detraccion,
}: {
  base: number;
  igv: number;
  total: number;
  porcentaje: number;
  detraccion: DetraccionMostrada | null;
}) {
  return (
    <div className="space-y-2">
      <dl className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-center">
        <div>
          <dt className="text-xs text-muted-foreground">Valor de venta</dt>
          <dd className="font-medium">{formatCurrency(base)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">IGV ({porcentaje}%)</dt>
          <dd className="font-medium">{formatCurrency(igv)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Total</dt>
          <dd className="text-lg font-bold">{formatCurrency(total)}</dd>
        </div>
      </dl>
      {detraccion && (
        <dl className="grid grid-cols-2 gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
          <div>
            <dt className="text-xs text-muted-foreground">
              Detracción ({detraccion.porcentaje}%)
            </dt>
            <dd className="font-medium">{formatCurrency(detraccion.monto)}</dd>
            <dd className="text-xs text-muted-foreground">
              {detraccion.cuenta
                ? `Banco de la Nación N.° ${detraccion.cuenta}`
                : "Cuenta de detracciones no registrada"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Neto que recibirás del cliente
            </dt>
            <dd className="text-lg font-bold">
              {formatCurrency(detraccion.neto)}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}

interface Props {
  viajeId: string;
  viajeNumero: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmitido: (factura: Factura) => void;
  onError: (mensaje: string) => void;
}

export function EmitirComprobanteDialog({
  viajeId,
  viajeNumero,
  open,
  onOpenChange,
  onEmitido,
  onError,
}: Props) {
  const { obtenerBorrador, previsualizar, emitir, cargando } =
    useComprobanteViaje(viajeId);
  const [borrador, setBorrador] = useState<ComprobanteBorrador | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoComprobanteVenta>("FACTURA");
  const [receptor, setReceptor] = useState<ReceptorComprobante>("CLIENTE");
  const [precio, setPrecio] = useState("");
  const [incluyeIgv, setIncluyeIgv] = useState(true);
  const [descripcion, setDescripcion] = useState("");
  const [vista, setVista] = useState<ComprobanteVistaPrevia | null>(null);
  const [revisado, setRevisado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBorrador(null);
    setErrorCarga(null);
    setVista(null);
    setRevisado(false);
    obtenerBorrador()
      .then((b) => {
        setBorrador(b);
        setTipo(b.tipo_sugerido);
        setReceptor("CLIENTE");
        setPrecio(
          b.precio_sugerido != null ? b.precio_sugerido.toFixed(2) : "",
        );
        setIncluyeIgv(b.precio_incluye_igv);
        setDescripcion(b.descripcion_sugerida);
      })
      .catch((e: Error) => setErrorCarga(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, viajeId]);

  const precioNumero = Number(precio);
  const precioValido =
    precio.trim() !== "" && Number.isFinite(precioNumero) && precioNumero > 0;
  const montos = useMemo(
    () =>
      precioValido && borrador
        ? calcular(precioNumero, incluyeIgv, borrador.porcentaje_igv)
        : null,
    [precioValido, precioNumero, incluyeIgv, borrador],
  );

  const entrada: EntradaComprobante = {
    tipo_documento: tipo,
    precio: Math.round(precioNumero * 100) / 100,
    precio_incluye_igv: incluyeIgv,
    receptor: tipo === "FACTURA" ? "CLIENTE" : receptor,
    descripcion: descripcion.trim() || null,
  };

  async function onRevisar() {
    try {
      setRevisado(false);
      setVista(await previsualizar(entrada));
    } catch (e) {
      setErrorCarga(
        e instanceof Error ? e.message : "No se pudo preparar la vista previa",
      );
    }
  }

  async function onConfirmar() {
    if (!vista) return;
    try {
      const factura = await emitir(entrada, vista.huella);
      onOpenChange(false);
      onEmitido(factura);
    } catch (e) {
      onOpenChange(false);
      onError(
        e instanceof Error ? e.message : "No se pudo emitir el comprobante",
      );
    }
  }

  const enviando = cargando === "emitir";
  const cliente = borrador?.cliente;
  const clienteConDni = cliente?.tipo_documento === "DNI";

  return (
    <Dialog
      open={open}
      onOpenChange={(abierto) => !enviando && onOpenChange(abierto)}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vista
              ? "Revisa el comprobante antes de enviarlo"
              : "Emitir comprobante del flete"}
          </DialogTitle>
          <DialogDescription>Viaje {viajeNumero}</DialogDescription>
        </DialogHeader>

        {!borrador && !errorCarga && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
        {errorCarga && <Avisos errores={[errorCarga]} advertencias={[]} />}

        {borrador && cliente && !vista && (
          <div className="space-y-5">
            {!borrador.puede_emitir && (
              <Avisos errores={borrador.bloqueos} advertencias={[]} />
            )}

            <div className="space-y-1.5">
              <Label>Comprobante</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["FACTURA", "BOLETA"] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={tipo === t ? "default" : "outline"}
                    onClick={() => setTipo(t)}
                    disabled={!borrador.puede_emitir}
                  >
                    {NOMBRE_TIPO[t]}
                    {borrador.tipo_sugerido === t && (
                      <span className="text-xs font-normal opacity-75">
                        (sugerido)
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              {tipo === "FACTURA" && clienteConDni && (
                <p className="text-xs text-destructive">
                  El cliente tiene DNI: SUNAT no acepta facturas, emite una
                  boleta.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>A nombre de</Label>
              {tipo === "BOLETA" ? (
                <div className="space-y-2 text-sm">
                  {(
                    [
                      [
                        "CLIENTE",
                        `${cliente.razon_social} · ${cliente.tipo_documento} ${cliente.numero_documento}`,
                      ],
                      [
                        "SIN_DOCUMENTO",
                        `Sin documento (CLIENTES VARIOS) · solo si el total es menor a ${formatCurrency(borrador.limite_boleta_sin_documento)}`,
                      ],
                    ] as const
                  ).map(([valor, texto]) => (
                    <label
                      key={valor}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="receptor"
                        className="h-4 w-4 accent-primary"
                        checked={receptor === valor}
                        onChange={() => setReceptor(valor)}
                      />
                      {texto}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  {cliente.razon_social} · {cliente.tipo_documento}{" "}
                  {cliente.numero_documento}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio-comprobante">Precio del flete (S/)</Label>
              <Input
                id="precio-comprobante"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0.01}
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                disabled={!borrador.puede_emitir}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="incluye-igv"
                  checked={incluyeIgv}
                  onCheckedChange={(v) => setIncluyeIgv(v === true)}
                  disabled={!borrador.puede_emitir}
                />
                <Label htmlFor="incluye-igv" className="font-normal">
                  El precio ya incluye IGV
                </Label>
              </div>
              {borrador.origen_precio === "COTIZACION" && (
                <p className="text-xs text-muted-foreground">
                  Precio tomado de la cotización (puedes cambiarlo).
                </p>
              )}
              {borrador.origen_precio === "FLETE_ESTIMADO" && (
                <p className="text-xs text-muted-foreground">
                  Flete estimado al activar el viaje, sin IGV (puedes
                  cambiarlo).
                </p>
              )}
              {montos && (
                <Totales
                  {...montos}
                  porcentaje={borrador.porcentaje_igv}
                  detraccion={calcularDetraccion(tipo, montos.total, borrador)}
                />
              )}
              {montos &&
                calcularDetraccion(tipo, montos.total, borrador) &&
                !borrador.cuenta_detracciones && (
                  <p className="flex gap-2 text-xs text-warning">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Esta factura lleva detracción y no registraste la cuenta del
                    Banco de la Nación. Regístrala en Configuración de la
                    empresa antes de emitir.
                  </p>
                )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion-comprobante">Descripción</Label>
              <Textarea
                id="descripcion-comprobante"
                rows={2}
                maxLength={500}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={!borrador.puede_emitir}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              Guía relacionada:{" "}
              {borrador.guia_remision ? (
                <>
                  <span className="font-medium text-foreground">
                    {borrador.guia_remision}
                  </span>
                  {borrador.guia_estado_sunat && (
                    <EstadoSunatBadge estado={borrador.guia_estado_sunat} />
                  )}
                </>
              ) : (
                "ninguna"
              )}
            </div>
          </div>
        )}

        {vista && (
          <div className="space-y-4">
            <Avisos errores={vista.errores} advertencias={vista.advertencias} />
            <dl className="divide-y rounded-lg border px-4 text-sm">
              {[
                [
                  "Comprobante",
                  `${NOMBRE_TIPO[vista.tipo_documento]} electrónica · serie ${vista.serie} (el número se asigna al emitir)`,
                ],
                [
                  "A nombre de",
                  `${vista.receptor_razon_social} · ${NOMBRE_DOCUMENTO[vista.receptor_tipo_documento] ?? vista.receptor_tipo_documento}${
                    vista.receptor_tipo_documento === "0"
                      ? ""
                      : ` ${vista.receptor_numero_documento}`
                  }`,
                ],
                ["Descripción", vista.descripcion],
                [
                  "Precio ingresado",
                  vista.precio_incluye_igv
                    ? "Incluía IGV"
                    : "Sin IGV (se sumó el 18%)",
                ],
                ["Guía relacionada", vista.guia_remision ?? "—"],
              ].map(([etiqueta, valor]) => (
                <div
                  key={etiqueta}
                  className="grid grid-cols-1 gap-0.5 py-1.5 sm:grid-cols-[9rem_1fr] sm:gap-3"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {etiqueta}
                  </dt>
                  <dd>{valor}</dd>
                </div>
              ))}
            </dl>
            <Totales
              base={vista.subtotal}
              igv={vista.igv}
              total={vista.total}
              porcentaje={vista.porcentaje_igv}
              detraccion={
                vista.detraccion_aplica
                  ? {
                      porcentaje: vista.detraccion_porcentaje,
                      monto: vista.detraccion_monto,
                      neto: vista.neto_a_cobrar,
                      cuenta: vista.detraccion_cuenta,
                    }
                  : null
              }
            />
            {!vista.detraccion_aplica && vista.tipo_documento === "FACTURA" && (
              <p className="text-xs text-muted-foreground">
                Detracción: {vista.detraccion_nota}
              </p>
            )}
            {vista.puede_emitir && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="comprobante-revisado"
                  checked={revisado}
                  onCheckedChange={(v) => setRevisado(v === true)}
                  disabled={enviando}
                />
                <Label
                  htmlFor="comprobante-revisado"
                  className="text-sm font-normal leading-snug"
                >
                  Revisé el comprobante y quiero enviarlo a SUNAT.
                </Label>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {vista ? (
            <>
              <Button
                variant="outline"
                onClick={() => setVista(null)}
                disabled={enviando}
              >
                <ArrowLeft className="h-4 w-4" /> Corregir
              </Button>
              <Button
                onClick={onConfirmar}
                disabled={!vista.puede_emitir || !revisado || enviando}
              >
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {enviando
                  ? "Enviando a SUNAT…"
                  : `Emitir ${NOMBRE_TIPO[vista.tipo_documento].toLowerCase()}`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={onRevisar}
                disabled={
                  !borrador?.puede_emitir ||
                  !precioValido ||
                  cargando === "vista-previa"
                }
                className={cn(!borrador && "invisible")}
              >
                {cargando === "vista-previa" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Revisar comprobante
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
