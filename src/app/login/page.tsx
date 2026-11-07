"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Truck } from "lucide-react";
import { z } from "zod";

import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthActions } from "@/hooks/use-auth-actions";
import { rutaInicioPara } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const loginSchema = z.object({
  email: z.string().min(5, "Ingresa un correo válido").email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type LoginValues = z.infer<typeof loginSchema>;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const panelVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

export default function LoginPage() {
  const router = useRouter();
  const { token, usuario, hidratado } = useAuthStore();
  const { login, cargando } = useAuthActions();
  // Hasta que React carga, el botón queda desactivado: si no, en una conexión lenta el
  // navegador enviaría el formulario como HTML y dejaría la contraseña en la URL.
  const [listo, setListo] = useState(false);
  useEffect(() => setListo(true), []);

  useEffect(() => {
    if (hidratado && token) router.replace(rutaInicioPara(usuario?.rol));
  }, [hidratado, token, usuario, router]);

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onLogin(values: LoginValues) {
    try {
      const data = await login(values.email, values.password);
      toast.success(`Bienvenido, ${data.usuario.nombres}`);
      router.push(rutaInicioPara(data.usuario.rol));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={panelVariants}
        className="relative hidden flex-col justify-between overflow-hidden bg-secondary p-12 text-secondary-foreground lg:flex"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, hsl(var(--primary)) 0, transparent 45%), radial-gradient(circle at 85% 75%, hsl(var(--primary)) 0, transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-sm font-semibold tracking-wide text-white/60">TRANSPORTE PRÍNCIPE</p>
            <p className="text-xs text-white/40">Sistema de gestión integral</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Truck className="mb-6 h-10 w-10 text-primary" strokeWidth={1.5} />
          <h1 className="text-3xl font-bold leading-tight text-white">
            Control total de flota, viajes y facturación en un solo lugar.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Cotizaciones, guías de remisión, constancias de pesos y medidas (DS N.º 058-2003-MTC),
            liquidaciones de dietas y rentabilidad por viaje — todo conectado con SUNAT.
          </p>
        </div>

        <p className="relative text-xs text-white/30">© {new Date().getFullYear()} Transporte Príncipe. Todos los derechos reservados.</p>
      </motion.div>

      {/* Panel del formulario */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <motion.div initial="hidden" animate="visible" variants={cardVariants} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark size={36} />
            <div>
              <p className="text-sm font-semibold">TRANSPORTE PRÍNCIPE</p>
              <p className="text-xs text-muted-foreground">Sistema de gestión integral</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold">Bienvenido de nuevo</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Ingresa tus credenciales para continuar.</p>
          <form method="post" onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="tucorreo@empresa.com" className="pl-9" {...loginForm.register("email")} />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-9" {...loginForm.register("password")} />
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={!listo || cargando}>
              {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
              {listo ? "Ingresar" : "Cargando…"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿No tienes cuenta? Pide al administrador que te cree un usuario.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
