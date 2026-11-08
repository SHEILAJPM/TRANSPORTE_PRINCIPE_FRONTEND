"use client";

import { AlertTriangle, Truck } from "lucide-react";

import { CarretaFormDialog } from "@/components/flota/carreta-form-dialog";
import { EstadoVehiculoBadge, VencimientoBadge } from "@/components/flota/estado-badge";
import { MantenimientoDialog } from "@/components/flota/mantenimiento-dialog";
import { TractoFormDialog } from "@/components/flota/tracto-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlertasVencimiento } from "@/hooks/use-alertas";
import { useCarretas, useTractos } from "@/hooks/use-flota";

export default function FlotaPage() {
  const { data: tractos, isLoading: cargandoTractos } = useTractos();
  const { data: carretas, isLoading: cargandoCarretas } = useCarretas();
  const { data: alertas, isLoading: cargandoAlertas } = useAlertasVencimiento();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Flota</h2>
        <p className="text-sm text-muted-foreground">Camiones, carretas, mantenimiento preventivo y vencimientos.</p>
      </div>

      <Tabs defaultValue="tractos">
        <TabsList>
          <TabsTrigger value="tractos">Camiones</TabsTrigger>
          <TabsTrigger value="carretas">Carretas</TabsTrigger>
          <TabsTrigger value="alertas">
            Alertas {alertas && alertas.length > 0 ? `(${alertas.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tractos" className="space-y-4">
          <div className="flex justify-end">
            <TractoFormDialog />
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {cargandoTractos ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (tractos ?? []).length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Truck className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aún no hay camiones registrados.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Config.</TableHead>
                    <TableHead>Peso máx.</TableHead>
                    <TableHead>SOAT</TableHead>
                    <TableHead>CITV</TableHead>
                    <TableHead>MTC</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tractos?.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="p-0">
                        <TractoFormDialog
                          tracto={t}
                          trigger={
                            <button className="block w-full px-4 py-3.5 text-left">
                              <p className="font-medium">{t.placa}</p>
                              <p className="text-xs text-muted-foreground">
                                {t.marca}
                                {t.modelo ? ` ${t.modelo}` : ""}
                              </p>
                            </button>
                          }
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.configuracion_vehicular}</TableCell>
                      <TableCell className="text-muted-foreground">{t.peso_bruto_max_kg.toLocaleString("es-PE")} kg</TableCell>
                      <TableCell>
                        <VencimientoBadge fecha={t.soat_vencimiento} />
                      </TableCell>
                      <TableCell>
                        <VencimientoBadge fecha={t.citv_vencimiento} />
                      </TableCell>
                      <TableCell>
                        <VencimientoBadge fecha={t.mtc_habilitacion_vencimiento} />
                      </TableCell>
                      <TableCell>
                        <EstadoVehiculoBadge estado={t.estado} />
                      </TableCell>
                      <TableCell>
                        <MantenimientoDialog tipo="tractos" vehiculoId={t.id} placa={t.placa} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="carretas" className="space-y-4">
          <div className="flex justify-end">
            <CarretaFormDialog />
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {cargandoCarretas ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (carretas ?? []).length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Truck className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aún no hay carretas registradas.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Config.</TableHead>
                    <TableHead>Peso máx.</TableHead>
                    <TableHead>SOAT</TableHead>
                    <TableHead>CITV</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carretas?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="p-0">
                        <CarretaFormDialog
                          carreta={c}
                          trigger={<button className="block w-full px-4 py-3.5 text-left font-medium">{c.placa}</button>}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.tipo_carreta === "SEMIRREMOLQUE" ? "Semirremolque" : "Remolque"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.configuracion_vehicular}</TableCell>
                      <TableCell className="text-muted-foreground">{c.peso_bruto_max_kg.toLocaleString("es-PE")} kg</TableCell>
                      <TableCell>
                        <VencimientoBadge fecha={c.soat_vencimiento} />
                      </TableCell>
                      <TableCell>
                        <VencimientoBadge fecha={c.citv_vencimiento} />
                      </TableCell>
                      <TableCell>
                        <EstadoVehiculoBadge estado={c.estado} />
                      </TableCell>
                      <TableCell>
                        <MantenimientoDialog tipo="carretas" vehiculoId={c.id} placa={c.placa} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alertas">
          <Card>
            <CardContent className="space-y-2 p-4">
              {cargandoAlertas && <Skeleton className="h-24 w-full" />}
              {!cargandoAlertas && (alertas ?? []).length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Sin vencimientos próximos. Todo al día.</p>
                </div>
              )}
              {alertas?.map((a) => (
                <div key={`${a.entidad_id}-${a.concepto}`} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{a.identificador}</p>
                    <p className="text-xs text-muted-foreground">{a.concepto.replace(/_/g, " ")} · {a.entidad_tipo}</p>
                  </div>
                  <Badge variant={a.vencido ? "destructive" : a.dias_restantes <= 7 ? "warning" : "outline"}>
                    {a.vencido ? "Vencido" : `${a.dias_restantes} d.`}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
