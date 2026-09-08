"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CloudOff, Loader2, RefreshCw, WifiOff } from "lucide-react";

import { useOfflineSync } from "@/hooks/use-offline-sync";
import { cn } from "@/lib/utils";

export function SyncStatusBar() {
  const { enLinea, pendientes, sincronizando, sincronizar } = useOfflineSync();

  const mostrar = !enLinea || pendientes > 0;

  return (
    <AnimatePresence>
      {mostrar && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "flex items-center justify-between gap-2 px-4 py-2 text-xs font-medium",
              enLinea ? "bg-warning/15 text-warning" : "bg-secondary text-secondary-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              {enLinea ? <CloudOff className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {enLinea
                ? `${pendientes} registro(s) pendiente(s) de sincronizar`
                : "Sin conexión — tus registros se guardan y se envían al reconectar"}
            </span>
            {enLinea && pendientes > 0 && (
              <button onClick={sincronizar} disabled={sincronizando} className="flex items-center gap-1 underline">
                {sincronizando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Sincronizar
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
