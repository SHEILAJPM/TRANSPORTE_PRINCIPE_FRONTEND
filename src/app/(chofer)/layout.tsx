"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { AuthGuard } from "@/components/layout/auth-guard";
import { SyncStatusBar } from "@/components/chofer/sync-status-bar";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export default function ChoferLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { usuario, cerrarSesion } = useAuthStore();

  function salir() {
    cerrarSesion();
    router.replace("/login");
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-muted/30">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-secondary px-4 py-3 text-secondary-foreground">
          <div className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <div className="leading-tight">
              <p className="text-sm font-semibold">{usuario ? `${usuario.nombres}` : "Chofer"}</p>
              <p className="text-[11px] text-white/50">Transporte Príncipe</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white" onClick={salir}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <SyncStatusBar />
        <main className="flex-1 px-4 py-5">{children}</main>
      </div>
    </AuthGuard>
  );
}
