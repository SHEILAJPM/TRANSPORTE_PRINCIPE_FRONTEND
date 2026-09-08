"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        <LogoMark size={36} />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Transporte Príncipe</p>
          <p className="text-[11px] text-white/40">Panel de gestión</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const activo = item.disponible && (pathname === item.href || pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          if (!item.disponible) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-sm text-white/30"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/30">
                  Pronto
                </span>
              </div>
            );
          }

          return (
            <Link key={item.href} href={item.href} className="relative block">
              {activo && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  activo ? "text-sidebar-accent-foreground" : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] leading-relaxed text-white/30">
          DS N.º 058-2003-MTC · Integrado con apisunat.pe
        </p>
      </div>
    </aside>
  );
}
