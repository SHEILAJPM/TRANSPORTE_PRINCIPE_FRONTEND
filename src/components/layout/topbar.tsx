"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, User, X } from "lucide-react";

import { LogoMark } from "@/components/brand/logo-mark";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

import { NAV_ITEMS } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

const ROL_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  OPERADOR: "Operador",
  CONTABILIDAD: "Contabilidad",
  CHOFER: "Chofer",
};

export function Topbar({ titulo }: { titulo: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, cerrarSesion } = useAuthStore();
  const [menuAbierto, setMenuAbierto] = useState(false);

  function salir() {
    cerrarSesion();
    router.replace("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuAbierto(true)}>
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className="flex-1 truncate text-base font-semibold sm:text-lg">{titulo}</h1>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80">
              <Avatar>
                <AvatarFallback>{usuario ? initials(usuario.nombres, usuario.apellidos) : <User className="h-4 w-4" />}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="truncate font-medium">{usuario ? `${usuario.nombres} ${usuario.apellidos}` : ""}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">
                {usuario ? ROL_LABEL[usuario.rol] ?? usuario.rol : ""}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={salir} className="text-destructive focus:text-destructive">
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <AnimatePresence>
        {menuAbierto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setMenuAbierto(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-3">
                  <LogoMark size={32} />
                  <p className="text-sm font-semibold text-white">Transporte Príncipe</p>
                </div>
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white" onClick={() => setMenuAbierto(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 px-3 py-2">
                {NAV_ITEMS.map((item) => {
                  const activo = item.disponible && pathname.startsWith(item.href);
                  const Icon = item.icon;
                  if (!item.disponible) {
                    return (
                      <div key={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/30">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuAbierto(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        activo ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-white/70 hover:bg-white/5"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
