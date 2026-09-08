"use client";

import { useMemo, useState } from "react";
import { getDepartments, getDistricts, getProvinces } from "ubigeo-fns";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface UbicacionValue {
  departamento: string;
  provincia: string;
  distrito: string;
  ubigeo: string;
}

const DEPARTAMENTOS = getDepartments();

export function SelectorUbicacion({ onChange }: { onChange: (valor: UbicacionValue) => void }) {
  const [depCode, setDepCode] = useState("");
  const [provCode, setProvCode] = useState("");
  const [distCode, setDistCode] = useState("");

  const provincias = useMemo(() => (depCode ? getProvinces(depCode) : []), [depCode]);
  const distritos = useMemo(() => (provCode ? getDistricts(provCode) : []), [provCode]);

  function onDepartamentoChange(code: string) {
    setDepCode(code);
    setProvCode("");
    setDistCode("");
    const departamento = DEPARTAMENTOS.find((d) => d.code === code)?.name ?? "";
    onChange({ departamento, provincia: "", distrito: "", ubigeo: "" });
  }

  function onProvinciaChange(code: string) {
    setProvCode(code);
    setDistCode("");
    const departamento = DEPARTAMENTOS.find((d) => d.code === depCode)?.name ?? "";
    const provincia = provincias.find((p) => p.code === code)?.name ?? "";
    onChange({ departamento, provincia, distrito: "", ubigeo: "" });
  }

  function onDistritoChange(code: string) {
    setDistCode(code);
    const departamento = DEPARTAMENTOS.find((d) => d.code === depCode)?.name ?? "";
    const provincia = provincias.find((p) => p.code === provCode)?.name ?? "";
    const distrito = distritos.find((d) => d.code === code)?.name ?? "";
    onChange({ departamento, provincia, distrito, ubigeo: code });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Departamento</Label>
        <Select value={depCode} onValueChange={onDepartamentoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTAMENTOS.map((d) => (
              <SelectItem key={d.code} value={d.code}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Provincia</Label>
        <Select value={provCode} onValueChange={onProvinciaChange} disabled={!depCode}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            {provincias.map((p) => (
              <SelectItem key={p.code} value={p.code}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Distrito</Label>
        <Select value={distCode} onValueChange={onDistritoChange} disabled={!provCode}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            {distritos.map((d) => (
              <SelectItem key={d.code} value={d.code}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
