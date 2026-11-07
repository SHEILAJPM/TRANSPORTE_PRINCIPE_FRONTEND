import {
  BarChart3,
  Building2,
  FileText,
  Gauge,
  LayoutDashboard,
  Receipt,
  Route,
  Scale,
  ScrollText,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  disponible: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Panel", href: "/dashboard", icon: LayoutDashboard, disponible: true },
  { label: "Cotizaciones", href: "/cotizaciones", icon: FileText, disponible: true },
  { label: "Viajes", href: "/viajes", icon: Route, disponible: true },
  { label: "Guías", href: "/guias", icon: ScrollText, disponible: true },
  { label: "Facturas", href: "/facturas", icon: Receipt, disponible: true },
  { label: "Flota", href: "/flota", icon: Truck, disponible: true },
  { label: "Choferes", href: "/choferes", icon: Users, disponible: true },
  { label: "Pesos y Medidas", href: "/pesos-medidas", icon: Scale, disponible: true },
  { label: "Reportes", href: "/reportes", icon: BarChart3, disponible: true },
  { label: "Rentabilidad", href: "/rentabilidad", icon: TrendingUp, disponible: true },
  { label: "Empresa", href: "/empresa", icon: Building2, disponible: true },
];

export const KPI_ICON = Gauge;
