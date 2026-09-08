import { api } from "@/lib/api";

const CLAVE_STORAGE = "tp-cola-offline";

export interface ItemCola {
  uuid_dispositivo: string;
  ruta: string; // p.ej. /viajes/{id}/gastos
  metodo: "post" | "patch";
  payload: Record<string, unknown>;
  creado_en: string;
  etiqueta: string; // texto legible para mostrar en la UI ("Combustible S/ 50.00")
}

function leerCola(): ItemCola[] {
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE);
    return raw ? (JSON.parse(raw) as ItemCola[]) : [];
  } catch {
    return [];
  }
}

function guardarCola(items: ItemCola[]) {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(items));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota excedida): se pierde la cola,
    // pero no debe romper el envío que ya se intentó.
  }
}

export function encolar(item: Omit<ItemCola, "creado_en">) {
  const cola = leerCola();
  cola.push({ ...item, creado_en: new Date().toISOString() });
  guardarCola(cola);
}

export function obtenerCola(): ItemCola[] {
  return leerCola();
}

export function contarPendientes(): number {
  return leerCola().length;
}

/**
 * Envía un registro (gasto o novedad): si hay conexión lo manda directo; si falla por
 * red, lo deja en la cola local para reintentar después. El backend es idempotente por
 * `uuid_dispositivo`, así que un reintento nunca duplica el registro.
 */
function enviar(item: Pick<ItemCola, "ruta" | "metodo" | "payload">) {
  return item.metodo === "patch" ? api.patch(item.ruta, item.payload) : api.post(item.ruta, item.payload);
}

export async function enviarOEncolar(item: Omit<ItemCola, "creado_en">): Promise<{ enviado: boolean }> {
  try {
    await enviar(item);
    return { enviado: true };
  } catch (err) {
    const esErrorDeRed = typeof err === "object" && err !== null && "response" in err && (err as { response?: unknown }).response === undefined;
    if (esErrorDeRed) {
      encolar(item);
      return { enviado: false };
    }
    throw err;
  }
}

/** Reintenta todos los elementos pendientes. Devuelve cuántos se sincronizaron. */
export async function sincronizarCola(): Promise<number> {
  const cola = leerCola();
  if (cola.length === 0) return 0;

  const restantes: ItemCola[] = [];
  let sincronizados = 0;

  for (const item of cola) {
    try {
      await enviar(item);
      sincronizados += 1;
    } catch {
      restantes.push(item);
    }
  }

  guardarCola(restantes);
  return sincronizados;
}
