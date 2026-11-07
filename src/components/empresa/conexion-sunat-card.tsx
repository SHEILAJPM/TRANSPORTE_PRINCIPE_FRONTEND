"use client";

import { CheckCircle2, Loader2, PlugZap, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConexionSunat } from "@/hooks/use-comprobantes";
import { cn } from "@/lib/utils";

/** Semáforo de cada conexión con SUNAT y botón que solo pide el token (no envía nada). */
export function ConexionSunatCard() {
  const { data, isLoading, probar, probando } = useConexionSunat();

  async function onProbar() {
    try {
      const resultado = await probar();
      if (resultado.ok) toast.success(resultado.mensaje);
      else toast.error(resultado.mensaje, { duration: 12000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo probar la conexión con SUNAT");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlugZap className="h-4 w-4" /> Conexión con SUNAT
        </CardTitle>
        <Button size="sm" variant="outline" onClick={onProbar} disabled={probando}>
          {probando ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
          Probar conexión con SUNAT
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || !data ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)
        ) : (
          <ul className="divide-y rounded-lg border">
            {data.conexiones.map((c) => (
              <li key={c.clave} className="flex gap-3 px-3 py-2.5">
                {c.lista ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{c.nombre}</p>
                  <p className={cn("text-xs", c.lista ? "text-muted-foreground" : "text-destructive")}>{c.detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          &ldquo;Probar conexión&rdquo; solo pide un token a SUNAT con el certificado, el client ID/secret y el usuario/clave SOL
          configurados en Render. No firma ni envía ningún documento.
        </p>
      </CardContent>
    </Card>
  );
}
