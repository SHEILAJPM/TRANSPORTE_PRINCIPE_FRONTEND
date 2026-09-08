"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [oscuro, setOscuro] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem("tp-theme");
    const esOscuro = guardado === "dark";
    setOscuro(esOscuro);
    document.documentElement.dataset.theme = esOscuro ? "dark" : "light";
    setMontado(true);
  }, []);

  function alternar() {
    const nuevo = !oscuro;
    setOscuro(nuevo);
    document.documentElement.dataset.theme = nuevo ? "dark" : "light";
    localStorage.setItem("tp-theme", nuevo ? "dark" : "light");
  }

  if (!montado) return <div className="h-10 w-10" />;

  return (
    <Button variant="ghost" size="icon" onClick={alternar} aria-label="Cambiar tema">
      {oscuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
