"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { rutaInicioPara } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export default function RootPage() {
  const router = useRouter();
  const { token, usuario, hidratado } = useAuthStore();

  useEffect(() => {
    if (!hidratado) return;
    router.replace(token ? rutaInicioPara(usuario?.rol) : "/login");
  }, [hidratado, token, usuario, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
