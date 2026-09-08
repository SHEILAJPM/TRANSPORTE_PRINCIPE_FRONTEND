import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { contarPendientes, sincronizarCola } from "@/lib/offline-queue";

export function useOfflineSync() {
  const [enLinea, setEnLinea] = useState(true);
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  const actualizarPendientes = useCallback(() => setPendientes(contarPendientes()), []);

  const sincronizar = useCallback(async () => {
    if (sincronizando) return;
    setSincronizando(true);
    try {
      const cantidad = await sincronizarCola();
      actualizarPendientes();
      if (cantidad > 0) toast.success(`${cantidad} registro(s) sincronizado(s)`);
    } finally {
      setSincronizando(false);
    }
  }, [sincronizando, actualizarPendientes]);

  useEffect(() => {
    setEnLinea(navigator.onLine);
    actualizarPendientes();

    function alConectar() {
      setEnLinea(true);
      sincronizar();
    }
    function alDesconectar() {
      setEnLinea(false);
    }

    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { enLinea, pendientes, sincronizando, sincronizar, actualizarPendientes };
}
