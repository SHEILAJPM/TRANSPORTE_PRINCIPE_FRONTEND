# Transporte Príncipe — Frontend

Panel de gestión web (Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + Framer Motion) para el backend en `../TRANSPORTE_PRINCIPE_BACKEND`. Identidad visual corporativa: rojo, negro y blanco.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** con tokens de diseño en `src/app/globals.css` (paleta rojo/negro/blanco, modo claro/oscuro vía `[data-theme]`)
- **shadcn/ui** (primitivas Radix escritas a mano en `src/components/ui/`) + **Framer Motion** para animaciones y microinteracciones
- **Zustand** (`src/stores/auth-store.ts`) con persistencia en `localStorage` para la sesión (JWT)
- **SWR** (`src/hooks/use-swr-api.ts`) para el cacheo/revalidación de datos del API
- **react-hook-form** + **zod** para formularios y validación

## Estructura

```
src/
├── app/
│   ├── login/                    # Login + registro de empresa (público)
│   └── (dashboard)/               # Shell autenticado (sidebar + topbar animados)
│       ├── dashboard/              # Panel con KPIs y alertas de vencimiento
│       └── cotizaciones/           # Listado, creación y conversión de 1 clic
├── components/
│   ├── ui/                        # Primitivas (button, input, dialog, select, table…)
│   ├── layout/                    # Sidebar, topbar, auth guard, transición de página
│   ├── brand/                     # Logo mark
│   ├── dashboard/                 # StatCard
│   └── cotizaciones/               # ClientePicker (SUNAT), diálogo de conversión, badge de estado
├── hooks/                          # use-cotizaciones, use-clientes, use-sunat, use-flota…
├── lib/                            # api.ts (axios + interceptor JWT), utils.ts
├── stores/                         # auth-store.ts (zustand)
└── types/api.ts                    # Tipos espejo de los esquemas Pydantic del backend
```

## Cómo correr el proyecto

```bash
npm install
cp .env.local.example .env.local   # si no existe, crear con NEXT_PUBLIC_API_URL
npm run dev
```

Requiere el backend corriendo en `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:8000/api/v1`, ver `.env.local`).

## Estado actual

Implementado: fundación de diseño (tokens, componentes base), autenticación (login + registro de empresa), shell del panel (sidebar/topbar animados, modo oscuro) y el módulo de **Cotizaciones** completo — creación con cálculo de IGV en vivo, autocompletado de cliente vía apisunat.pe, buscador con filtros animados, flujo de estados (Borrador → Enviada → Aprobada/Rechazada) y el botón de **conversión de 1 clic** a Viaje + Guía de Remisión + Factura + Constancia de Pesos y Medidas.

Pendiente (rutas ya reservadas en el sidebar como "Pronto"): Viajes, Flota, Choferes, Pesos y Medidas, Reportes, Empresa — sus endpoints ya existen en el backend, falta construir la UI siguiendo el mismo patrón (`hook SWR → página → componentes`).
