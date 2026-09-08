"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Building2, ImagePlus, Loader2, Lock, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmpresa, useEmpresaActions } from "@/hooks/use-empresa";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

interface FormValues {
  razon_social: string;
  nombre_comercial: string;
  direccion_fiscal: string;
  distrito: string;
  provincia: string;
  departamento: string;
  telefono: string;
  email: string;
  serie_factura_default: string;
  serie_guia_remision_default: string;
  numero_registro_mtc: string;
}

export default function EmpresaPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "ADMIN";
  const { data: empresa, isLoading } = useEmpresa();
  const { actualizar, subirLogo, cargando } = useEmpresaActions();
  const inputLogoRef = useRef<HTMLInputElement>(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (empresa) {
      reset({
        razon_social: empresa.razon_social,
        nombre_comercial: empresa.nombre_comercial ?? "",
        direccion_fiscal: empresa.direccion_fiscal ?? "",
        distrito: empresa.distrito ?? "",
        provincia: empresa.provincia ?? "",
        departamento: empresa.departamento ?? "",
        telefono: empresa.telefono ?? "",
        email: empresa.email ?? "",
        serie_factura_default: empresa.serie_factura_default ?? "",
        serie_guia_remision_default: empresa.serie_guia_remision_default ?? "",
        numero_registro_mtc: empresa.numero_registro_mtc ?? "",
      });
    }
  }, [empresa, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await actualizar(values);
      toast.success("Datos de la empresa actualizados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la empresa");
    }
  }

  async function onSeleccionarLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoLogo(true);
    try {
      await subirLogo(archivo);
      toast.success("Logotipo actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir el logotipo");
    } finally {
      setSubiendoLogo(false);
      if (inputLogoRef.current) inputLogoRef.current.value = "";
    }
  }

  if (isLoading || !empresa) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Empresa</h2>
        <p className="text-sm text-muted-foreground">Datos fiscales y logotipo corporativo usados en tus documentos.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImagePlus className="h-4 w-4" /> Logotipo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-5">
            {empresa.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={empresa.logo_url}
                alt="Logo de la empresa"
                className="h-20 w-20 rounded-xl border border-border object-contain p-2"
              />
            ) : (
              <LogoMark size={80} />
            )}
            <div className="space-y-2">
              <input
                ref={inputLogoRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={onSeleccionarLogo}
                disabled={!esAdmin}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputLogoRef.current?.click()}
                disabled={!esAdmin || subiendoLogo}
              >
                {subiendoLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {empresa.logo_url ? "Cambiar logotipo" : "Subir logotipo"}
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP o SVG. Aparece en cotizaciones, facturas, guías de remisión y constancias.
                {empresa.logo_actualizado_en && ` Actualizado el ${formatDate(empresa.logo_actualizado_en)}.`}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Datos fiscales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>RUC</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={empresa.ruc} disabled className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="razon_social">Razón social</Label>
                <Input id="razon_social" disabled={!esAdmin} {...register("razon_social", { required: true })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nombre_comercial">Nombre comercial</Label>
              <Input id="nombre_comercial" disabled={!esAdmin} {...register("nombre_comercial")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="direccion_fiscal">Dirección fiscal</Label>
              <Input id="direccion_fiscal" disabled={!esAdmin} {...register("direccion_fiscal")} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="distrito">Distrito</Label>
                <Input id="distrito" disabled={!esAdmin} {...register("distrito")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="provincia">Provincia</Label>
                <Input id="provincia" disabled={!esAdmin} {...register("provincia")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="departamento">Departamento</Label>
                <Input id="departamento" disabled={!esAdmin} {...register("departamento")} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" disabled={!esAdmin} {...register("telefono")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" disabled={!esAdmin} {...register("email")} />
              </div>
            </div>

            <Separator />

            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Series de numeración por defecto
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="serie_factura_default">Serie de Factura</Label>
                <Input id="serie_factura_default" placeholder="F001" disabled={!esAdmin} {...register("serie_factura_default")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="serie_guia_remision_default">Serie de Guía de Remisión</Label>
                <Input
                  id="serie_guia_remision_default"
                  placeholder="V001"
                  disabled={!esAdmin}
                  {...register("serie_guia_remision_default")}
                />
                <p className="text-xs text-muted-foreground">
                  SUNAT exige el prefijo &quot;V&quot; para guías de remisión emitidas como transportista.
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="numero_registro_mtc">N.° de Registro/Habilitación Vehicular ante el MTC</Label>
              <Input id="numero_registro_mtc" disabled={!esAdmin} {...register("numero_registro_mtc")} />
              <p className="text-xs text-muted-foreground">
                Se envía en cada Guía de Remisión Transportista emitida electrónicamente a SUNAT.
              </p>
            </div>

            {esAdmin ? (
              <Button type="submit" disabled={cargando}>
                {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar cambios
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Solo un administrador puede editar estos datos.</p>
            )}
          </CardContent>
        </Card>
      </motion.form>
    </div>
  );
}
