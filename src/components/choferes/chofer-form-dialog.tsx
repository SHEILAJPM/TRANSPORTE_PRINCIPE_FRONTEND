"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChoferActions, useChoferes } from "@/hooks/use-choferes";
import { useConsultaDni } from "@/hooks/use-sunat";
import type { Chofer } from "@/types/api";

interface FormValues {
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  direccion: string;
  licencia_numero: string;
  licencia_categoria: string;
  licencia_vencimiento: string;
  examen_medico_fecha: string;
  examen_medico_vencimiento: string;
  tarifa_diaria_default: number;
  bono_nocturno_default: number;
}

export function ChoferFormDialog({ chofer, trigger }: { chofer?: Chofer; trigger?: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const { crear, actualizar, cargando } = useChoferActions();
  const esEdicion = Boolean(chofer);

  const { consultar, cargando: consultandoDni } = useConsultaDni();
  const { data: choferesRegistrados } = useChoferes(false);
  const [dniConsultado, setDniConsultado] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm<FormValues>({
    defaultValues: { licencia_categoria: "A-III-C", tarifa_diaria_default: 0, bono_nocturno_default: 0 },
  });

  useEffect(() => {
    if (abierto && chofer) {
      reset({
        dni: chofer.dni,
        nombres: chofer.nombres,
        apellidos: chofer.apellidos,
        telefono: chofer.telefono ?? "",
        direccion: "",
        licencia_numero: chofer.licencia_numero,
        licencia_categoria: chofer.licencia_categoria,
        licencia_vencimiento: chofer.licencia_vencimiento?.slice(0, 10) ?? "",
        examen_medico_fecha: "",
        examen_medico_vencimiento: "",
        tarifa_diaria_default: chofer.tarifa_diaria_default,
        bono_nocturno_default: chofer.bono_nocturno_default,
      });
    } else if (abierto) {
      setDniConsultado(null);
      reset({ licencia_categoria: "A-III-C", tarifa_diaria_default: 0, bono_nocturno_default: 0, dni: "", nombres: "", apellidos: "", telefono: "", direccion: "", licencia_numero: "", licencia_vencimiento: "", examen_medico_fecha: "", examen_medico_vencimiento: "" });
    }
  }, [abierto, chofer, reset]);

  // Al completar los 8 dígitos del DNI (solo al registrar) se traen nombres y apellidos de RENIEC.
  const dni = watch("dni") ?? "";
  useEffect(() => {
    if (!abierto || esEdicion || !/^\d{8}$/.test(dni) || dni === dniConsultado) return;
    if (choferesRegistrados?.some((c) => c.dni === dni)) {
      toast.error(`Ya hay un chofer registrado con el DNI ${dni}`);
      setDniConsultado(dni);
      return;
    }
    void buscarDni(dni);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dni, abierto, esEdicion]);

  async function buscarDni(numero: string) {
    setDniConsultado(numero);
    try {
      const datos = await consultar(numero);
      setValue("nombres", datos.nombres, { shouldValidate: true });
      setValue("apellidos", `${datos.apellido_paterno} ${datos.apellido_materno}`.trim(), { shouldValidate: true });
      if (!getValues("licencia_numero")) {
        setValue("licencia_numero", `Q${numero}`);
      }
      toast.success(`DNI encontrado: ${datos.nombres} ${datos.apellido_paterno}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo consultar el DNI");
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      if (esEdicion && chofer) {
        await actualizar(chofer.id, {
          nombres: values.nombres,
          apellidos: values.apellidos,
          telefono: values.telefono || null,
          direccion: values.direccion || null,
          licencia_numero: values.licencia_numero,
          licencia_categoria: values.licencia_categoria,
          licencia_vencimiento: values.licencia_vencimiento,
          examen_medico_fecha: values.examen_medico_fecha || null,
          examen_medico_vencimiento: values.examen_medico_vencimiento || null,
          tarifa_diaria_default: Number(values.tarifa_diaria_default),
          bono_nocturno_default: Number(values.bono_nocturno_default),
        });
        toast.success("Chofer actualizado");
      } else {
        await crear({
          dni: values.dni,
          nombres: values.nombres,
          apellidos: values.apellidos,
          telefono: values.telefono || null,
          direccion: values.direccion || null,
          licencia_numero: values.licencia_numero,
          licencia_categoria: values.licencia_categoria,
          licencia_vencimiento: values.licencia_vencimiento,
          examen_medico_fecha: values.examen_medico_fecha || null,
          examen_medico_vencimiento: values.examen_medico_vencimiento || null,
          tarifa_diaria_default: Number(values.tarifa_diaria_default),
          bono_nocturno_default: Number(values.bono_nocturno_default),
        });
        toast.success("Chofer registrado");
      }
      setAbierto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el chofer");
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus /> Nuevo chofer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar chofer" : "Registrar chofer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dni">DNI</Label>
              <div className="relative">
                <Input
                  id="dni"
                  maxLength={8}
                  inputMode="numeric"
                  placeholder="8 dígitos"
                  disabled={esEdicion}
                  className="pr-9"
                  {...register("dni", { required: !esEdicion, pattern: /^\d{8}$/ })}
                />
                {!esEdicion && (
                  <button
                    type="button"
                    title="Buscar nombres en RENIEC"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    disabled={consultandoDni || !/^\d{8}$/.test(dni)}
                    onClick={() => buscarDni(dni)}
                  >
                    {consultandoDni ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </button>
                )}
              </div>
              {!esEdicion && <p className="text-xs text-muted-foreground">Al escribir el DNI se completan los nombres (RENIEC).</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" {...register("telefono")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nombres">Nombres</Label>
              <Input id="nombres" {...register("nombres", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input id="apellidos" {...register("apellidos", { required: true })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" {...register("direccion")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="licencia_numero">N.° de licencia</Label>
              <Input id="licencia_numero" placeholder="p.ej. Q87654321" {...register("licencia_numero", { required: true })} />
              <p className="text-xs text-muted-foreground">Verifica la letra en la licencia física.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="licencia_categoria">Categoría</Label>
              <Input id="licencia_categoria" {...register("licencia_categoria", { required: true })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="licencia_vencimiento">Vencimiento de licencia</Label>
              <Input id="licencia_vencimiento" type="date" {...register("licencia_vencimiento", { required: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="examen_medico_fecha">Examen médico (fecha)</Label>
              <Input id="examen_medico_fecha" type="date" {...register("examen_medico_fecha")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="examen_medico_vencimiento">Examen médico (vence)</Label>
              <Input id="examen_medico_vencimiento" type="date" {...register("examen_medico_vencimiento")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tarifa_diaria_default">Tarifa diaria (S/)</Label>
              <Input id="tarifa_diaria_default" type="number" step="0.01" {...register("tarifa_diaria_default", { required: true, min: 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bono_nocturno_default">Bono nocturno (S/)</Label>
              <Input id="bono_nocturno_default" type="number" step="0.01" {...register("bono_nocturno_default", { required: true, min: 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando}>
              {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
