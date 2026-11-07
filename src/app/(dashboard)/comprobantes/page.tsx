import { redirect } from "next/navigation";

// "Comprobantes" se separó en dos menús propios: Guías y Facturas.
export default function ComprobantesPage() {
  redirect("/facturas");
}
