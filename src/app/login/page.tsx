"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Truck } from "lucide-react";
import { z } from "zod";

import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthActions } from "@/hooks/use-auth-actions";
import { rutaInicioPara } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const loginSchema = z.object({
  email: z.string().min(5, "Ingresa un correo válido").email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

const registroSchema = z.object({
  ruc: z.string().regex(/^\d{11}$/, "El RUC debe tener 11 dígitos"),
  razon_social: z.string().min(3, "Ingresa la razón social"),
  admin_nombres: z.string().min(2, "Ingresa tus nombres"),
  admin_apellidos: z.string().min(2, "Ingresa tus apellidos"),
  admin_email: z.string().email("Correo inválido"),
  admin_password: z.string().min(8, "Mínimo 8 caracteres"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegistroValues = z.infer<typeof registroSchema>;

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
  const { login, registrarEmpresa, cargando } = useAuthActions();
  const [tab, setTab] = useState<"login" | "registro">("login");

  useEffect(() => {
    if (hidratado && token) router.replace(rutaInicioPara(usuario?.rol));
  }, [hidratado, token, usuario, router]);

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const registroForm = useForm<RegistroValues>({ resolver: zodResolver(registroSchema) });

  async function onLogin(values: LoginValues) {
    try {
      const data = await login(values.email, values.password);
      toast.success(`Bienvenido, ${data.usuario.nombres}`);
      router.push(rutaInicioPara(data.usuario.rol));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    }
  }

  async function onRegistro(values: RegistroValues) {
    try {
      const data = await registrarEmpresa(values);
      toast.success(`Empresa registrada. Bienvenido, ${data.usuario.nombres}`);
      router.push(rutaInicioPara(data.usuario.rol));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar la empresa");
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

          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "registro")}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="registro">Registrar empresa</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {tab === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="login" forceMount>
                    <h2 className="text-xl font-semibold">Bienvenido de nuevo</h2>
                    <p className="mb-6 mt-1 text-sm text-muted-foreground">Ingresa tus credenciales para continuar.</p>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
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
                      <Button type="submit" className="w-full" disabled={cargando}>
                        {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
                        Ingresar
                      </Button>
                    </form>
                  </TabsContent>
                </motion.div>
              ) : (
                <motion.div
                  key="registro"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="registro" forceMount>
                    <h2 className="text-xl font-semibold">Registra tu empresa</h2>
                    <p className="mb-6 mt-1 text-sm text-muted-foreground">
                      Crea la cuenta de tu empresa y tu usuario administrador.
                    </p>
                    <form onSubmit={registroForm.handleSubmit(onRegistro)} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="ruc">RUC</Label>
                          <Input id="ruc" maxLength={11} placeholder="20123456789" {...registroForm.register("ruc")} />
                          {registroForm.formState.errors.ruc && (
                            <p className="text-xs text-destructive">{registroForm.formState.errors.ruc.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="razon_social">Razón social</Label>
                          <Input id="razon_social" placeholder="Transporte Príncipe S.A.C." {...registroForm.register("razon_social")} />
                          {registroForm.formState.errors.razon_social && (
                            <p className="text-xs text-destructive">{registroForm.formState.errors.razon_social.message}</p>
                          )}
                        </div>
                      </div>
                      <Separator className="my-1" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="admin_nombres">Tus nombres</Label>
                          <Input id="admin_nombres" {...registroForm.register("admin_nombres")} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="admin_apellidos">Tus apellidos</Label>
                          <Input id="admin_apellidos" {...registroForm.register("admin_apellidos")} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin_email">Correo del administrador</Label>
                        <Input id="admin_email" type="email" {...registroForm.register("admin_email")} />
                        {registroForm.formState.errors.admin_email && (
                          <p className="text-xs text-destructive">{registroForm.formState.errors.admin_email.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="admin_password">Contraseña</Label>
                        <Input id="admin_password" type="password" placeholder="Mínimo 8 caracteres" {...registroForm.register("admin_password")} />
                        {registroForm.formState.errors.admin_password && (
                          <p className="text-xs text-destructive">{registroForm.formState.errors.admin_password.message}</p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={cargando}>
                        {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
                        Crear empresa y usuario
                      </Button>
                    </form>
                  </TabsContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
