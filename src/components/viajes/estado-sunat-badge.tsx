import { Badge } from "@/components/ui/badge";
import type { EstadoSunat } from "@/types/api";

const VARIANTE: Record<EstadoSunat, "outline" | "warning" | "success" | "destructive"> = {
  PENDIENTE: "outline",
  ACEPTADO: "success",
  RECHAZADO: "destructive",
  ANULADO: "destructive",
};

export function EstadoSunatBadge({ estado }: { estado: EstadoSunat }) {
  return <Badge variant={VARIANTE[estado]}>SUNAT: {estado}</Badge>;
}
