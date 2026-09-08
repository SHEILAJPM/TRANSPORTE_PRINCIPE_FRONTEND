import { useState } from "react";

import { api, extraerMensajeError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { TokenResponse } from "@/types/api";

export interface RegistroEmpresaPayload {
  ruc: string;
  razon_social: string;
  admin_nombres: string;
  admin_apellidos: string;
  admin_email: string;
  admin_password: string;
}

export function useAuthActions() {
  const iniciarSesion = useAuthStore((s) => s.iniciarSesion);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string) {
    setCargando(true);
    setError(null);
    try {
      const body = new URLSearchParams();
      body.set("username", email);
      body.set("password", password);
      const { data } = await api.post<TokenResponse>("/auth/login", body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      iniciarSesion(data.access_token, data.usuario);
      return data;
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo iniciar sesión");
      setError(mensaje);
      throw new Error(mensaje);
    } finally {
      setCargando(false);
    }
  }

  async function registrarEmpresa(payload: RegistroEmpresaPayload) {
    setCargando(true);
    setError(null);
    try {
      const { data } = await api.post<TokenResponse>("/auth/registro-empresa", payload);
      iniciarSesion(data.access_token, data.usuario);
      return data;
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo registrar la empresa");
      setError(mensaje);
      throw new Error(mensaje);
    } finally {
      setCargando(false);
    }
  }

  return { login, registrarEmpresa, cargando, error };
}
