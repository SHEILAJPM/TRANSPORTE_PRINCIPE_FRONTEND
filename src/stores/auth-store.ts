import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Usuario } from "@/types/api";

interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  hidratado: boolean;
  iniciarSesion: (token: string, usuario: Usuario) => void;
  cerrarSesion: () => void;
  setHidratado: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      hidratado: false,
      iniciarSesion: (token, usuario) => set({ token, usuario }),
      cerrarSesion: () => set({ token: null, usuario: null }),
      setHidratado: () => set({ hidratado: true }),
    }),
    {
      name: "transporte-principe-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHidratado();
      },
    }
  )
);
