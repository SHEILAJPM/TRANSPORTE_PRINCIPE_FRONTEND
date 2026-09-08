import axios from "axios";

import { useAuthStore } from "@/stores/auth-store";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().cerrarSesion();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function extraerMensajeError(error: unknown, fallback = "Ocurrió un error inesperado"): string {
  if (axios.isAxiosError(error)) {
    const detalle = error.response?.data?.detail;
    if (typeof detalle === "string") return detalle;
    // FastAPI devuelve 422 con `detail` como lista de errores de validación
    // ([{ loc, msg, type }]), no como string.
    if (Array.isArray(detalle)) {
      const mensajes = detalle
        .map((item) => (typeof item?.msg === "string" ? item.msg : null))
        .filter((msg): msg is string => Boolean(msg));
      if (mensajes.length > 0) return mensajes.join(" · ");
    }
    if (!error.response) return "No se pudo conectar con el servidor";
  }
  return fallback;
}
