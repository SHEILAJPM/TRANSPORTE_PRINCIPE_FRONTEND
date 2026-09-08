import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string, currency: "PEN" | "USD" = "PEN") {
  const numero = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
}

export function formatDate(value: string | Date, withTime = false) {
  const fecha = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(fecha);
}

export function initials(nombres: string, apellidos: string) {
  return `${nombres?.[0] ?? ""}${apellidos?.[0] ?? ""}`.toUpperCase();
}

/** Los choferes aterrizan en la vista móvil; el resto de roles, en el panel de escritorio. */
export function rutaInicioPara(rol: string | undefined) {
  return rol === "CHOFER" ? "/chofer" : "/dashboard";
}
