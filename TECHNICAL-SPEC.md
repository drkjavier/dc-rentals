# DC Rentals — Especificación Técnica de Implementación

> **Propósito**: Este documento complementa `LANDING-PAGE.md` con especificaciones técnicas concretas, estructura de archivos, schemas, convenciones de código y guías de implementación para el agente de desarrollo.
>
> **Contexto de esta versión (v2)**: La app se construye con **Astro** (no Next.js), con una **base de datos sencilla** (Content Collections + Supabase), **sin módulo de pagos** en el MVP (solicitud de reserva con confirmación manual) y desplegada en el **plan gratuito de Vercel**. El módulo Stripe queda documentado como implementación futura.

---

## Índice

1. [Inicialización del Proyecto](#1-inicialización-del-proyecto)
2. [Estructura de Archivos](#2-estructura-de-archivos)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [Base de Datos — Content Collections + Supabase](#4-base-de-datos--content-collections--supabase)
5. [Arquitectura de Componentes](#5-arquitectura-de-componentes)
6. [Sistema de Diseño y Tokens](#6-sistema-de-diseño-y-tokens)
7. [Configuración de i18n](#7-configuración-de-i18n)
8. [API Endpoints — Contratos Detallados](#8-api-endpoints--contratos-detallados)
9. [Estado y Data Fetching](#9-estado-y-data-fetching)
10. [Calendario de Disponibilidad — Lógica](#10-calendario-de-disponibilidad--lógica)
11. [Motor de Precios](#11-motor-de-precios)
12. [Flujo de Reserva (sin pagos) y Módulo de Pagos Futuro](#12-flujo-de-reserva-sin-pagos-y-módulo-de-pagos-futuro)
13. [Imágenes y Media](#13-imágenes-y-media)
14. [SEO — Implementación Técnica](#14-seo--implementación-técnica)
15. [Testing](#15-testing)
16. [Convenciones de Código](#16-convenciones-de-código)
17. [Configuración de Deploy — Vercel Hobby](#17-configuración-de-deploy--vercel-hobby)
18. [Accesibilidad — Checklist Técnico](#18-accesibilidad--checklist-técnico)
19. [Performance Budget](#19-performance-budget)
20. [Decisiones Técnicas Clave (ADR)](#20-decisiones-técnicas-clave-adr)

---

## 1. Inicialización del Proyecto

### 1.1 Comandos de setup

```bash
# Crear proyecto Astro con TypeScript estricto y Tailwind
npm create astro@latest dc-rentals -- --template minimal --typescript strict --install --git

cd dc-rentals

# Integraciones oficiales de Astro
npx astro add react tailwind sitemap vercel -- --yes

# Dependencias principales
npm install @supabase/supabase-js \
  zod \
  date-fns \
  lucide-react \
  clsx tailwind-merge \
  astro-seo

# Dependencias de desarrollo
npm install -D \
  @types/node @types/react @types/react-dom \
  prettier eslint-config-prettier \
  eslint-plugin-astro eslint-plugin-jsx-a11y \
  vitest @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom \
  @playwright/test \
  tailwindcss-animate
```

> **Nota**: NO se instalan `stripe`, `@prisma/client`, `next-intl` ni `tRPC` en el MVP. Ver [ADR-011](#adr-011-pagos-deshabilitados-en-el-mvp) para el módulo de pagos futuro.

### 1.2 Configuraciones base

**`astro.config.mjs`** — Config Astro con adaptador de Vercel, React islands y Tailwind:

```javascript
// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  site: "https://dc-rentals.ca",
  output: "hybrid",           // SSG por defecto + server endpoints
  adapter: vercel(),
  integrations: [
    react(),                  // Islands interactivos (React)
    tailwind({ applyBaseStyles: false }),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: { en: "en-CA", fr: "fr-CA" },
      },
    }),
  ],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
    routing: {
      prefixDefaultLocale: false,   // /en/... y /fr/... (raíz redirige)
    },
  },
  image: {
    // Optimización local con sharp (Astro 4+ usa sharp por defecto)
    domains: ["res.cloudinary.com"],
  },
  vite: {
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});
```

**`tsconfig.json`** — Paths y strict mode:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/styles/*": ["./src/styles/*"]
    },
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  },
  "include": [".astro/types.d.ts", "src/**/*"],
  "exclude": ["dist"]
}
```

**`tailwind.config.mjs`** — Extender con tokens del diseño:

```javascript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1E40AF",
          secondary: "#059669",
          accent: "#D97706",
          danger: "#DC2626",
          warning: "#F59E0B",
        },
        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
        status: {
          available: "#059669",
          occupied: "#DC2626",
          maintenance: "#F59E0B",
          partial: "#D97706",
          upcoming: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      screens: {
        mobile: "0px",
        tablet: "640px",
        desktop: "1024px",
        wide: "1440px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 2. Estructura de Archivos

```
dc-rentals/
├── .env.local                    # Variables de entorno (no commitear)
├── .env.example                  # Template de variables
├── astro.config.mjs              # Config Astro (SSG híbrido + Vercel)
├── tailwind.config.mjs           # Config Tailwind
├── tsconfig.json
├── package.json
│
├── supabase/
│   ├── migrations/               # Migraciones versionadas (fuente de verdad, ADR-021)
│   ├── config.toml               # Config de la Supabase CLI
│   └── README.md                 # Flujo de migraciones (db:push)
│
├── public/
│   ├── fonts/                    # Inter, Plus Jakarta Sans, JetBrains Mono
│   ├── images/
│   │   ├── hero/                 # Imágenes hero (paisajes canadienses)
│   │   ├── vehicles/             # Fotos de vehículos organizadas por código
│   │   ├── routes/               # Fotos de rutas
│   │   └── og/                   # Open Graph images
│   └── floorplans/               # SVGs de planos de planta
│
├── src/
│   ├── content.config.ts         # Definición de Content Collections (Zod)
│   │
│   ├── content/                  # ← BASE DE DATOS DEL CATÁLOGO (archivos)
│   │   ├── vehicles/             # Una entrada por vehículo (JSON)
│   │   │   ├── dc-c3-001.json
│   │   │   ├── dc-ca-002.json
│   │   │   └── ...
│   │   ├── routes/               # Rutas de viaje (MDX, bilingüe)
│   │   │   ├── rocky-mountains.en.mdx
│   │   │   ├── rocky-mountains.fr.mdx
│   │   │   └── ...
│   │   ├── blog/                 # Artículos (MDX, bilingüe)
│   │   │   ├── how-to-rent-rv-canada.en.mdx
│   │   │   └── ...
│   │   └── faq/                  # Preguntas frecuentes (JSON)
│   │       └── faq.json
│   │
│   ├── pages/                    # Enrutamiento Astro (file-based)
│   │   ├── index.astro           # Redirect → /en o /fr según Accept-Language
│   │   ├── 404.astro
│   │   │
│   │   ├── [locale]/             # Segmento de idioma (en|fr)
│   │   │   ├── index.astro       # Landing page principal
│   │   │   ├── vehicles/
│   │   │   │   ├── index.astro   # Catálogo con filtros (island)
│   │   │   │   └── [slug].astro  # Ficha de unidad (SSG)
│   │   │   ├── routes/
│   │   │   │   └── [slug].astro  # Detalle de ruta (MDX)
│   │   │   ├── blog/
│   │   │   │   └── [slug].astro  # Artículo (MDX)
│   │   │   ├── faq.astro
│   │   │   └── booking/
│   │   │       ├── index.astro   # Flujo de solicitud de reserva (island)
│   │   │       └── thank-you.astro  # Confirmación de solicitud enviada
│   │   │
│   │   ├── api/                  # Server endpoints (serverless en Vercel)
│   │   │   ├── availability.ts   # GET  → calendario de disponibilidad
│   │   │   ├── availability-check.ts  # GET → verificar rango
│   │   │   ├── reservations.ts   # POST → crear solicitud de reserva
│   │   │   └── vehicles.json.ts  # GET  → catálogo como JSON (para filtros)
│   │   │
│   │   ├── sitemap.xml.ts        # Sitemap generado (o @astrojs/sitemap)
│   │   └── robots.txt.ts
│   │
│   ├── components/
│   │   ├── ui/                   # Componentes base (Astro + JSX mínimos)
│   │   │   ├── button.astro
│   │   │   ├── badge.astro
│   │   │   ├── card.astro
│   │   │   ├── input.astro
│   │   │   ├── select.astro
│   │   │   ├── dialog.tsx        # Interactivos → React island
│   │   │   ├── accordion.tsx
│   │   │   └── tooltip.tsx
│   │   │
│   │   ├── layout/               # Componentes de layout (Astro)
│   │   │   ├── header.astro
│   │   │   ├── footer.astro
│   │   │   ├── mobile-nav.tsx    # island
│   │     │   ├── language-switcher.tsx  # island
│   │   │   └── container.astro
│   │   │
│   │   ├── vehicle/              # Componentes de vehículo (Astro, estáticos)
│   │   │   ├── vehicle-card.astro
│   │   │   ├── vehicle-grid.astro
│   │   │   ├── vehicle-filters.tsx   # island (interactividad)
│   │   │   ├── vehicle-sort.tsx      # island
│   │   │   ├── vehicle-gallery.tsx   # island (lightbox)
│   │   │   ├── vehicle-specs.astro
│   │   │   ├── vehicle-amenities.astro
│   │   │   ├── vehicle-floorplan.astro
│   │   │   ├── vehicle-status-badge.astro
│   │   │   └── vehicle-pricing.astro
│   │   │
│   │   ├── calendar/             # Componentes de calendario (React islands)
│   │   │   ├── availability-calendar.tsx
│   │   │   ├── date-range-picker.tsx
│   │   │   ├── day-cell.tsx
│   │   │   └── availability-legend.tsx
│   │   │
│   │   ├── booking/              # Solicitud de reserva (React islands)
│   │   │   ├── booking-widget.tsx
│   │   │   ├── price-breakdown.tsx
│   │   │   ├── extras-selector.tsx
│   │   │   ├── booking-summary.tsx
│   │   │   └── booking-form.tsx
│   │   │
│   │   ├── landing/              # Secciones de la landing (Astro)
│   │   │   ├── hero-section.astro
│   │   │   ├── how-it-works.astro
│   │   │   ├── featured-vehicles.astro
│   │   │   ├── popular-routes.astro
│   │   │   ├── testimonials.astro
│   │   │   ├── faq-section.tsx   # island (accordion)
│   │   │   └── cta-section.astro
│   │   │
│   │   ├── map/                  # Mapa interactivo (islands)
│   │   │   ├── location-map.tsx
│   │   │   └── route-map.tsx
│   │   │
│   │   └── shared/               # Componentes compartidos
│   │       ├── image-gallery.tsx
│   │       ├── star-rating.astro
│   │       ├── review-card.astro
│   │       ├── metric-imperial.tsx
│   │       ├── notification-form.tsx
│   │       ├── seo-head.astro    # <head> con metadata + JSON-LD
│   │       └── json-ld.astro
│   │
│   ├── lib/                      # Utilidades y configuraciones
│   │   ├── supabase.ts           # Cliente Supabase (server, service role)
│   │   ├── supabase-browser.ts   # Cliente Supabase (browser, anon key)
│   │   ├── content.ts            # Helpers para leer Content Collections
│   │   ├── pricing.ts            # Motor de precios (funciones puras)
│   │   ├── availability.ts       # Lógica de disponibilidad (funciones puras)
│   │   ├── validation.ts         # Schemas Zod compartidos (API + forms)
│   │   ├── email.ts              # Notificaciones por email (Resend, opcional)
│   │   ├── constants.ts          # Constantes globales
│   │   └── utils.ts              # cn(), formatCAD(), etc.
│   │
│   ├── hooks/                    # Custom hooks (para islands React)
│   │   ├── use-vehicle-filters.ts
│   │   ├── use-availability.ts
│   │   ├── use-price-calculator.ts
│   │   └── use-unit-preference.ts  # métrico/imperial
│   │
│   ├── stores/                   # Zustand stores (islands)
│   │   ├── booking-store.ts
│   │   └── filter-store.ts
│   │
│   ├── types/                    # Tipos TypeScript
│   │   ├── vehicle.ts
│   │   ├── reservation.ts
│   │   ├── availability.ts
│   │   └── pricing.ts
│   │
│   └── styles/
│       └── globals.css           # Tailwind directives + custom
│
└── tests/
    ├── setup.ts
    ├── unit/
    │   ├── pricing.test.ts
    │   ├── availability.test.ts
    │   └── content-schema.test.ts
    └── e2e/
        ├── vehicle-detail.spec.ts
        └── reservation-request.spec.ts
```

### 2.1 Estrategia de datos: por qué este modelo

| Tipo de dato | Almacenamiento | Actualización |
|---|---|---|
| Catálogo (vehículos, specs, amenities, precios) | Content Collections (`src/content/vehicles/*.json`) | Commit al repo → rebuild automático en Vercel |
| Rutas y blog | Content Collections (MDX bilingüe) | Commit al repo |
| FAQ, config del sitio | Content Collections (JSON) | Commit al repo |
| Disponibilidad (bloques) | Supabase (`availability_blocks`) | Dashboard Supabase o SQL (manual MVP) |
| Solicitudes de reserva | Supabase (`reservation_requests`) | Server endpoint `POST /api/reservations` |
| Reseñas | Fase futura (Supabase) | — |

> **Ventaja clave**: el catálogo es contenido versionado (auditable, revisable en PRs, sin costo de BD) y solo lo realmente dinámico (disponibilidad y reservas) vive en Supabase. Esto mantiene el plan gratuito de Vercel y de Supabase holgadamente.

---

## 3. Variables de Entorno

**`.env.example`** — Documentar todas las variables requeridas:

```env
# ─── Base de datos (Supabase — plan Free) ────────────────
PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="eyJ..."        # Solo lectura pública (RLS)
SUPABASE_SERVICE_ROLE_KEY="eyJ..."       # SOLO server (nunca exponer al browser)

# ─── App ─────────────────────────────────────────────────
PUBLIC_BASE_URL="http://localhost:4321"
PUBLIC_SITE_URL="http://localhost:4321"

# ─── Email (Resend — opcional en MVP) ────────────────────
RESEND_API_KEY=""                        # Vacío = sin emails, solo registro en BD
EMAIL_FROM="bookings@dc-rentals.ca"

# ─── Imágenes (Cloudinary) ───────────────────────────────
PUBLIC_CLOUDINARY_CLOUD_NAME=""

# ─── Maps (Mapbox) ──────────────────────────────────────
PUBLIC_MAPBOX_ACCESS_TOKEN=""

# ─── Analytics ───────────────────────────────────────────
PUBLIC_PLAUSIBLE_DOMAIN="dc-rentals.ca"

# ─── Feature Flags ───────────────────────────────────────
PUBLIC_ENABLE_COMPARE="false"
PUBLIC_ENABLE_NOTIFICATIONS="true"
PUBLIC_ENABLE_BLOG="false"              # Activar en Fase 3
PUBLIC_ENABLE_PAYMENTS="false"          # ← MÓDULO DE PAGOS DESHABILITADO (Fase futura)
```

> **Convención Astro**: todo variable expuesta al browser debe llevar prefijo `PUBLIC_`. Las claves de service role de Supabase y Resend **nunca** se exponen al cliente.

---

## 4. Base de Datos — Content Collections + Supabase

### 4.1 Content Collections (catálogo — archivos locales)

**`src/content.config.ts`** — Esquemas Zod de las colecciones:

```typescript
// src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

const vehicleType = z.enum([
  "CLASS_A", "CLASS_B", "CLASS_C", "TRAVEL_TRAILER",
  "FIFTH_WHEEL", "TRUCK_CAMPER", "CAMPER_VAN",
]);

const vehicleStatus = z.enum([
  "AVAILABLE", "OCCUPIED", "MAINTENANCE", "PARTIALLY_BOOKED", "COMING_SOON",
]);

const vehicleSpecsSchema = z.object({
  // Dimensiones exteriores
  lengthM: z.number(),
  lengthFt: z.string(),               // "26 ft 8 in"
  widthM: z.number(),
  widthIn: z.number(),
  heightM: z.number(),
  heightFt: z.string(),
  // Dimensiones interiores
  interiorHeightM: z.number(),
  interiorHeightFt: z.string(),
  areaSqm: z.number(),
  areaSqft: z.number(),
  slideOuts: z.number().default(0),
  // Tanques (galones + litros calculados)
  freshWaterGal: z.number(),
  grayWaterGal: z.number(),
  blackWaterGal: z.number(),
  freshWaterL: z.number(),
  grayWaterL: z.number(),
  blackWaterL: z.number(),
  fuelCapacityGal: z.number(),
  fuelCapacityL: z.number(),
  // Peso
  gvwrLbs: z.number(),
  gvwrKg: z.number(),
  towingCapacityLbs: z.number().optional(),
  towingCapacityKg: z.number().optional(),
  // Motor
  chassis: z.string(),
  engine: z.string(),
  transmission: z.string(),
  fuelType: z.string(),
  mpg: z.string(),                    // "8-12"
  mpgL100km: z.string(),              // "29-19"
  drivetrain: z.string().optional(),
  // Generador
  generatorWatts: z.number().optional(),
  generatorHoursInc: z.number().optional(),
  // Exterior
  awningType: z.string().optional(),
  awningLengthFt: z.string().optional(),
  exteriorShower: z.boolean().default(false),
  exteriorGrill: z.boolean().default(false),
  backupCamera: z.boolean().default(false),
  bikeRack: z.boolean().default(false),
  levelingJacks: z.string().optional(),
});

const imageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  altFr: z.string().optional(),
  category: z.enum([
    "EXTERIOR", "KITCHEN", "BATHROOM", "BEDROOM", "LIVING", "FLOORPLAN", "DETAIL",
  ]),
  sortOrder: z.number().default(0),
});

const amenitySchema = z.object({
  id: z.string(),                     // id de la amenidad (catálogo estático)
  detail: z.string().optional(),      // "10 cu ft", "13,500 BTU"
  detailFr: z.string().optional(),
});

const vehicles = defineCollection({
  loader: file("src/content/vehicles/*.json"),
  schema: z.object({
    internalCode: z.string().regex(/^DC-[A-Z0-9]+-\d+$/),   // "DC-C3-001"
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string(),
    brand: z.string(),
    model: z.string(),
    year: z.number(),
    type: vehicleType,
    status: vehicleStatus.default("AVAILABLE"),
    description: z.string(),
    descriptionFr: z.string(),
    // Capacidad
    sleepCapacity: z.number(),
    seatBelts: z.number(),
    petFriendly: z.boolean().default(false),
    // Precios (CAD)
    pricePerNightCAD: z.number(),
    priceLowSeasonCAD: z.number().optional(),
    priceHighSeasonCAD: z.number().optional(),
    pricePeakSeasonCAD: z.number().optional(),
    securityDepositCAD: z.number().default(1000),
    // Ubicación (referencia a datos estáticos de location)
    locationId: z.string(),
    // Media
    mainImage: z.string(),
    floorPlanSvg: z.string().optional(),
    images: z.array(imageSchema).default([]),
    specs: vehicleSpecsSchema,
    amenities: z.array(amenitySchema).default([]),
    // Metadata
    availableFromDate: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    active: z.boolean().default(true),
  }),
});

const routes = defineCollection({
  loader: glob({ pattern: "**/*.{en,fr}.mdx", base: "./src/content/routes" }),
  schema: z.object({
    locale: z.enum(["en", "fr"]),
    name: z.string(),
    description: z.string(),
    distance: z.string(),             // "2,800 km"
    duration: z.string(),             // "7-10 days"
    difficulty: z.enum(["easy", "moderate", "challenging"]),
    bestSeason: z.string(),
    image: z.string(),
    stops: z.array(z.object({
      name: z.string(),
      lat: z.number(),
      lng: z.number(),
      description: z.string().optional(),
    })),
    highlights: z.array(z.string()),
    regionIds: z.array(z.string()).default([]),
    active: z.boolean().default(true),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{en,fr}.mdx", base: "./src/content/blog" }),
  schema: z.object({
    locale: z.enum(["en", "fr"]),
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    author: z.string().default("DC Rentals"),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const faq = defineCollection({
  loader: file("src/content/faq/faq.json"),
  schema: z.object({
    locale: z.enum(["en", "fr"]),
    category: z.string(),
    question: z.string(),
    answer: z.string(),
    sortOrder: z.number().default(0),
  }),
});

export const collections = { vehicles, routes, blog, faq };
```

**Ejemplo de entrada — `src/content/vehicles/dc-c3-001.json`**:

```json
{
  "internalCode": "DC-C3-001",
  "slug": "2024-jayco-redhawk-26b",
  "name": "2024 Jayco Redhawk 26B",
  "brand": "Jayco",
  "model": "Redhawk 26B",
  "year": 2024,
  "type": "CLASS_C",
  "status": "AVAILABLE",
  "description": "Spacious Class C motorhome built on the Ford E-450 chassis...",
  "descriptionFr": "Camping-car de classe C spacieux sur châssis Ford E-450...",
  "sleepCapacity": 8,
  "seatBelts": 8,
  "petFriendly": true,
  "pricePerNightCAD": 189,
  "securityDepositCAD": 1000,
  "locationId": "calgary-depot",
  "mainImage": "/images/vehicles/DC-C3-001/exterior-01.webp",
  "floorPlanSvg": "/floorplans/dc-c3-001.svg",
  "images": [
    { "url": "/images/vehicles/DC-C3-001/exterior-01.webp", "alt": "2024 Jayco Redhawk 26B exterior front three-quarter view", "altFr": "Vue avant trois quarts de l'extérieur du Jayco Redhawk 26B 2024", "category": "EXTERIOR", "sortOrder": 0 },
    { "url": "/images/vehicles/DC-C3-001/kitchen-01.webp", "alt": "Fully equipped kitchen with three-burner stove and fridge", "category": "KITCHEN", "sortOrder": 1 }
  ],
  "specs": {
    "lengthM": 8.13, "lengthFt": "26 ft 8 in",
    "widthM": 2.57, "widthIn": 101,
    "heightM": 3.66, "heightFt": "12 ft",
    "interiorHeightM": 2.03, "interiorHeightFt": "6 ft 8 in",
    "areaSqm": 23.2, "areaSqft": 250, "slideOuts": 1,
    "freshWaterGal": 72, "grayWaterGal": 62, "blackWaterGal": 39,
    "freshWaterL": 273, "grayWaterL": 235, "blackWaterL": 148,
    "fuelCapacityGal": 55, "fuelCapacityL": 208,
    "gvwrLbs": 14500, "gvwrKg": 6577,
    "chassis": "Ford E-450",
    "engine": "7.3L V8 Gasoline",
    "transmission": "6-speed automatic",
    "fuelType": "gasoline",
    "mpg": "8-12", "mpgL100km": "29-19",
    "generatorWatts": 4000, "generatorHoursInc": 4,
    "awningType": "power", "exteriorShower": true, "backupCamera": true
  },
  "amenities": [
    { "id": "three-burner-stove", "detail": "3 burners", "detailFr": "3 brûleurs" },
    { "id": "ac-13500", "detail": "13,500 BTU", "detailFr": "13 500 BTU" }
  ],
  "featured": true,
  "active": true
}
```

### 4.2 Supabase (datos dinámicos — plan Free)

Supabase provee Postgres gestionado con 500 MB y 5 GB de egress en el plan gratuito, suficiente para disponibilidad y solicitudes de reserva.

**`supabase/schema.sql`**:

```sql
-- ─── Enums ───────────────────────────────────────────────
create type availability_block_type as enum
  ('RESERVATION', 'MAINTENANCE', 'BLOCKED', 'COMING_SOON');

create type reservation_status as enum
  ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- ─── availability_blocks ─────────────────────────────────
-- Nota: vehicle_id guarda el internalCode del vehículo en Content Collections
-- (ej. "DC-C3-001"), no una FK relacional, porque el catálogo vive en archivos.
create table public.availability_blocks (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  text not null,
  start_date  date not null,
  end_date    date not null,
  type        availability_block_type not null default 'RESERVATION',
  reason      text,
  created_at  timestamptz not null default now(),
  constraint valid_range check (end_date >= start_date)
);

create index idx_blocks_vehicle_dates
  on public.availability_blocks (vehicle_id, start_date, end_date);

-- ─── reservation_requests ────────────────────────────────
-- Solicitud de reserva SIN PAGO. Se confirma manualmente (dashboard/SQL).
-- price_snapshot congela el PriceBreakdown calculado al momento de solicitar.
create table public.reservation_requests (
  id             uuid primary key default gen_random_uuid(),
  vehicle_id     text not null,
  start_date     date not null,
  end_date       date not null,
  nights         int not null,
  km_package     text,
  extras         jsonb default '[]'::jsonb,
  delivery_address text,
  price_snapshot jsonb not null,
  status         reservation_status not null default 'PENDING',
  -- Info del huésped
  guest_name     text not null,
  guest_email    text not null,
  guest_phone    text,
  guest_province text,
  guest_country  text not null default 'CA',
  license_type   text,
  driver_age     int,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint valid_dates check (end_date > start_date)
);

create index idx_requests_status on public.reservation_requests (status);
create index idx_requests_email on public.reservation_requests (guest_email);
create index idx_requests_dates on public.reservation_requests (vehicle_id, start_date, end_date);

-- ─── notification_subscriptions ──────────────────────────
create table public.notification_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  vehicle_id text not null,
  email      text not null,
  phone      text,
  triggered  boolean not null default false,
  created_at timestamptz not null default now(),
  unique (vehicle_id, email)
);

-- ─── Row Level Security ──────────────────────────────────
alter table public.availability_blocks enable row level security;
alter table public.reservation_requests enable row level security;
alter table public.notification_subscriptions enable row level security;

-- Lectura pública de disponibilidad (necesaria para el calendario en browser)
create policy "Public read availability"
  on public.availability_blocks for select
  using (true);

-- Solicitudes de reserva: nadie las lee ni escribe desde el browser.
-- Solo el server endpoint usa la service role key (bypass RLS).
-- Si en el futuro se quiere insertar desde browser, crear policy de INSERT con
-- validación de campos; en el MVP NO se permite.
```

**Operaciones desde el browser usan la anon key** (solo lectura de `availability_blocks`). **El endpoint `POST /api/reservations` usa la service role key** (server-only) para insertar `reservation_requests` y verificar conflictos.

**Confirmación manual de reservas (MVP)** — desde el dashboard de Supabase o SQL:

```sql
-- Confirmar una solicitud y bloquear disponibilidad (ejecutar en SQL Editor)
update public.reservation_requests
set status = 'CONFIRMED', updated_at = now()
where id = '<request-id>';

insert into public.availability_blocks (vehicle_id, start_date, end_date, type, reason)
select vehicle_id, start_date, end_date, 'RESERVATION', 'Confirmed request'
from public.reservation_requests
where id = '<request-id>';
```

> En Fase 2 se agrega un endpoint protegido `POST /api/admin/confirm` con autenticación para evitar el SQL manual.

---

## 5. Arquitectura de Componentes

### 5.1 Principio: Astro por defecto, React islands cuando sea necesario

Astro renderiza **HTML estático cero-JS** por defecto. Los componentes React (`client:*`) se usan **solo** donde hay estado o interacción real. Esto es el equivalente al patrón Server/Client Components de Next.js:

| Componente | Tipo | Razón |
|---|---|---|
| `VehicleCard` | `.astro` (estático) | Datos estáticos, SEO, cero JS |
| `VehicleGrid` | `.astro` (estático) | Lista renderizada en build |
| `VehicleFilters` | `client:visible` (island) | Checkboxes, sliders, estado |
| `AvailabilityCalendar` | `client:load` (island) | Click handlers, fetch de disponibilidad |
| `BookingWidget` | `client:load` (island) | Formulario, cálculo de precio en vivo |
| `PriceBreakdown` | incluido en BookingWidget | Cálculo reactivo |
| `HeroSection` | `.astro` (estático) | Contenido estático, SSR/SSG |
| `DateRangePicker` | parte del calendar island | Interacción de calendario |
| `LanguageSwitcher` | `client:load` (island) | Navegación dinámica |
| `MapboxMap` | `client:visible` (island) | Interactividad de mapa (carga pesada) |
| `Header` / `Footer` | `.astro` (estático) | Layout sin JS |

### 5.2 Patrón de componentes

```astro
---
// src/components/vehicle/vehicle-card.astro
import { cn } from "@/lib/utils";
import { VehicleStatusBadge } from "./vehicle-status-badge.astro";
import type { VehicleSummary } from "@/types/vehicle";

interface Props {
  vehicle: VehicleSummary;
  locale: "en" | "fr";
  showStatus?: boolean;
  className?: string;
}

const { vehicle, locale, showStatus = true, className } = Astro.props;

const vehicleUrl = locale === "fr"
  ? `/fr/vehicules/${vehicle.slug}`
  : `/en/vehicles/${vehicle.slug}`;
---

<article
  class={cn(
    "group relative rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md",
    className
  )}
>
  <img
    src={vehicle.mainImage}
    alt={vehicle.name}
    width="600"
    height="400"
    loading="lazy"
    class="aspect-[3/2] w-full rounded-t-xl object-cover"
  />

  <div class="flex flex-1 flex-col p-4">
    <div class="mb-2 flex items-start justify-between">
      <div>
        <h3 class="font-heading text-lg font-semibold text-neutral-900">
          <a href={vehicleUrl} class="after:absolute after:inset-0">
            {vehicle.name}
          </a>
        </h3>
        <p class="text-sm text-neutral-500">
          {vehicle.typeLabel} · {vehicle.year}
        </p>
      </div>
      {showStatus && <VehicleStatusBadge status={vehicle.status} />}
    </div>

    <div class="mb-3 flex gap-4 text-sm text-neutral-600">
      <span>🛏 {vehicle.sleepCapacity}</span>
      <span>📐 {vehicle.lengthDisplay}</span>
      <span>📍 {vehicle.locationName}</span>
    </div>

    <p class="mt-auto font-semibold text-neutral-900">
      Desde ${vehicle.pricePerNightCAD} <span class="text-sm font-normal text-neutral-500">CAD/noche</span>
    </p>
  </div>
</article>
```

### 5.3 Composition pattern para Vehicle Detail (SSG)

```astro
---
// src/pages/[locale]/vehicles/[slug].astro
import Layout from "@/components/layout/layout.astro";
import SeoHead from "@/components/shared/seo-head.astro";
import VehicleGallery from "@/components/vehicle/vehicle-gallery";
import VehicleSpecs from "@/components/vehicle/vehicle-specs.astro";
import VehicleAmenities from "@/components/vehicle/vehicle-amenities.astro";
import VehicleFloorplan from "@/components/vehicle/vehicle-floorplan.astro";
import AvailabilityCalendar from "@/components/calendar/availability-calendar";
import BookingWidget from "@/components/booking/booking-widget";
import ReviewList from "@/components/shared/review-card.astro";
import VehicleGrid from "@/components/vehicle/vehicle-grid.astro";
import { getVehicleBySlug, getSimilarVehicles } from "@/lib/content";
import { getVehicleMetadata } from "@/lib/utils";

export function getStaticPaths() {
  // Genera /en/vehicles/[slug] y /fr/vehicules/[slug] en build time
  // (implementación: iterar colección vehicles × locales)
}

const { locale, slug } = Astro.params;
const vehicle = await getVehicleBySlug(slug!, locale as "en" | "fr");
if (!vehicle) return Astro.redirect("/404");

const similar = await getSimilarVehicles(vehicle);
const metadata = getVehicleMetadata(vehicle, locale!);
---

<Layout locale={locale!} description={metadata.description}>
  <SeoHead slot="head" {...metadata} />

  {/* Galería — island solo si hay lightbox */}
  <VehicleGallery images={vehicle.images} client:visible />

  <main class="container-page py-8">
    <div class="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div class="space-y-8">
        <VehicleSpecs specs={vehicle.specs} locale={locale!} />
        <VehicleAmenities amenities={vehicle.amenities} locale={locale!} />
        {vehicle.floorPlanSvg && (
          <VehicleFloorplan svgUrl={vehicle.floorPlanSvg} />
        )}
        {/* Calendario — island porque consulta disponibilidad en tiempo real */}
        <AvailabilityCalendar
          vehicleId={vehicle.internalCode}
          client:visible
        />
        <ReviewList reviews={vehicle.reviews} locale={locale!} />
      </div>

      <aside class="lg:sticky lg:top-24 lg:self-start">
        {/* Widget de reserva — island con formulario + cálculo en vivo */}
        <BookingWidget
          vehicle={vehicle}
          locale={locale!}
          client:visible
        />
      </aside>
    </div>

    <VehicleGrid vehicles={similar} locale={locale!} />
  </main>
</Layout>
```

---

## 6. Sistema de Diseño y Tokens

### 6.1 CSS Custom Properties

```css
/* src/styles/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Brand colors */
    --color-primary: 29 64 175;        /* #1E40AF */
    --color-secondary: 5 150 105;      /* #059669 */
    --color-accent: 217 119 6;         /* #D97706 */
    --color-danger: 220 38 38;         /* #DC2626 */
    --color-warning: 245 158 11;       /* #F59E0B */

    /* Status colors */
    --color-status-available: 5 150 105;
    --color-status-occupied: 220 38 38;
    --color-status-maintenance: 245 158 11;
    --color-status-partial: 217 119 6;
    --color-status-upcoming: 59 130 246;

    /* Spacing scale */
    --space-section: 5rem;
    --space-block: 3rem;

    /* Typography scale */
    --text-hero: 3rem;
    --text-h1: 2.25rem;
    --text-h2: 1.875rem;
    --text-h3: 1.5rem;
    --text-body: 1rem;
    --text-small: 0.875rem;
    --text-specs: 0.875rem;

    /* Border radius */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;

    /* Shadows */
    --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-card-hover: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

    /* Transitions */
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }
}

@layer components {
  .container-page {
    @apply mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8;
  }

  .section-spacing {
    @apply py-16 sm:py-20 lg:py-24;
  }

  .status-badge {
    @apply inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium;
  }

  .spec-grid {
    @apply grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3;
  }
}
```

### 6.2 Componentes UI base

Los componentes base se escriben como componentes Astro (`.astro`) para mantener cero JS. Los pocos que necesitan interacción (dialog, accordion, tooltip) se implementan como React islands ligeras o con `<details>` nativo.

---

## 7. Configuración de i18n

### 7.1 i18n nativo de Astro

Astro tiene i18n integrado en el router. La configuración está en `astro.config.mjs` (sección [1.2](#12-configuraciones-base)):

```javascript
i18n: {
  defaultLocale: "en",
  locales: ["en", "fr"],
  routing: {
    prefixDefaultLocale: false,   // /en/... y /fr/...
  },
}
```

**`src/lib/i18n.ts`** — Config helper:

```typescript
// src/lib/i18n.ts
export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeConfig: Record<Locale, {
  name: string;
  flag: string;
  htmlLang: string;
  ogLocale: string;
}> = {
  en: { name: "English", flag: "🇨🇦", htmlLang: "en-CA", ogLocale: "en_CA" },
  fr: { name: "Français", flag: "🇨🇦", htmlLang: "fr-CA", ogLocale: "fr_CA" },
};

/** Traducciones para componentes (nav, UI). El contenido usa Content Collections. */
import en from "../../public/locales/en/common.json";
import fr from "../../public/locales/fr/common.json";

const messages = { en, fr };

export function t(locale: Locale, key: string, vars?: Record<string, string | number>) {
  const parts = key.split(".");
  let value: unknown = messages[locale];
  for (const part of parts) {
    value = (value as Record<string, unknown>)?.[part];
  }
  if (typeof value !== "string") return key;
  return vars
    ? value.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
    : value;
}

/** Rutas localizadas: /fr usa "vehicules" en vez de "vehicles" */
export function localizedPath(locale: Locale, path: string): string {
  const frPaths: Record<string, string> = { vehicles: "vehicules", routes: "itineraires" };
  const translated = locale === "fr"
    ? path.replace(/^\/(vehicles|routes)\//, (m) => `/${frPaths[m.slice(1)]}/`)
    : path;
  return `/${locale}${translated}`;
}
```

**Redirect en `src/pages/index.astro`**:

```astro
---
// Detectar idioma del browser y redirigir (SSG con fallback, o middleware)
import { defaultLocale } from "@/lib/i18n";
const accept = Astro.request.headers.get("accept-language") ?? "";
const locale = accept.includes("fr") ? "fr" : defaultLocale;
return Astro.redirect(`/${locale}`);
---
```

### 7.2 Estructura de archivos de traducción (UI)

Los JSON viven en `public/locales/{en,fr}/common.json` y solo cubren **UI strings** (nav, botones, labels). El contenido (vehículos, rutas, blog) está en las colecciones con campos `*Fr` o entradas por locale.

```json
// public/locales/en/common.json
{
  "nav": {
    "vehicles": "Fleet",
    "routes": "Routes",
    "faq": "FAQ",
    "blog": "Blog",
    "contact": "Contact",
    "book_now": "Book Now"
  },
  "hero": {
    "title": "Explore Canada in Your Home on Wheels",
    "subtitle": "Premium RV rentals for unforgettable road trips across Canada",
    "cta_fleet": "View Available Fleet",
    "cta_customize": "Customize Your Trip",
    "vehicles_available": "{count} RVs available"
  },
  "booking": {
    "check_in": "Check-in",
    "check_out": "Check-out",
    "per_night": "/night",
    "from": "From",
    "request_now": "Request Reservation",
    "request_note": "No payment required. We confirm availability within 24h.",
    "price_breakdown": "Price Breakdown",
    "base_rate": "Base rate × {nights} nights",
    "km_package": "Kilometre package ({km} km)",
    "insurance": "Insurance × {days} days",
    "extras": "Extras",
    "delivery": "Delivery",
    "subtotal": "Subtotal",
    "tax": "{taxLabel}",
    "total": "Estimated total",
    "security_deposit": "Security deposit (refundable, paid at pickup)",
    "cad": "CAD"
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try again",
    "see_all": "See all",
    "close": "Close",
    "reviews": "{count} reviews"
  }
}
```

> **Nota**: se eliminan los plurals ICU de next-intl; con la simplicidad del MVP basta con templates de string. Si se necesita pluralización futura, añadir `intl-messageformat` o similar.

---

## 8. API Endpoints — Contratos Detallados

tRPC se reemplaza por **Server Endpoints nativos de Astro** (`src/pages/api/*.ts`), que se despliegan como serverless functions en Vercel con el adaptador. Validación con Zod compartido.

### 8.1 `GET /api/vehicles.json`

Devuelve el catálogo completo como JSON para que el island de filtros filtre en el browser (el catálogo es pequeño — decenas de vehículos —, así que no hace falta paginación server-side).

```typescript
// src/pages/api/vehicles.json.ts
import type { APIRoute } from "astro";
import { getVehiclesForApi } from "@/lib/content";

export const prerender = false;   // ← obligatorio: fuerza serverless

export const GET: APIRoute = async () => {
  const vehicles = await getVehiclesForApi();

  return new Response(JSON.stringify(vehicles), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",   // 5 min
    },
  });
};
```

### 8.2 `GET /api/availability`

```typescript
// src/pages/api/availability.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { generateCalendarDays } from "@/lib/availability";

export const prerender = false;

const querySchema = z.object({
  vehicleId: z.string().min(1),                 // internalCode, ej. "DC-C3-001"
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
  months: z.coerce.number().min(1).max(3).default(2),
});

export const GET: APIRoute = async ({ url, locals }) => {
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
  }
  const { vehicleId, year, month, months } = parsed.data;

  const supabase = createServerClient(locals);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month - 1 + months, 0);

  const { data: blocks, error } = await supabase
    .from("availability_blocks")
    .select("start_date, end_date, type")
    .eq("vehicle_id", vehicleId)
    .lte("start_date", endDate.toISOString().split("T")[0])
    .gte("end_date", startDate.toISOString().split("T")[0])
    .order("start_date");

  if (error) {
    return new Response(JSON.stringify({ error: "DB error" }), { status: 500 });
  }

  const days = generateCalendarDays(year, month, months, blocks ?? []);

  return new Response(JSON.stringify({ days }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
  });
};
```

### 8.3 `GET /api/availability-check`

```typescript
// src/pages/api/availability-check.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

export const prerender = false;

const querySchema = z.object({
  vehicleId: z.string(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const GET: APIRoute = async ({ url, locals }) => {
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid params" }), { status: 400 });
  }
  const { vehicleId, start, end } = parsed.data;

  const supabase = createServerClient(locals);
  const { data: conflicts } = await supabase
    .from("availability_blocks")
    .select("start_date, end_date, type")
    .eq("vehicle_id", vehicleId)
    .lte("start_date", end)
    .gte("end_date", start);

  return new Response(
    JSON.stringify({
      available: (conflicts ?? []).length === 0,
      conflicts: conflicts ?? [],
    }),
    { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
  );
};
```

### 8.4 `POST /api/reservations` — Solicitud de reserva (SIN PAGO)

```typescript
// src/pages/api/reservations.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { calculatePrice } from "@/lib/pricing";
import { getVehicleByCode } from "@/lib/content";
import { sendReservationRequestEmails } from "@/lib/email";

export const prerender = false;

export const reservationRequestSchema = z.object({
  vehicleId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestName: z.string().min(2).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().max(20).optional(),
  guestProvince: z.string().max(50).optional(),
  licenseType: z.string().max(20).optional(),
  driverAge: z.number().int().min(21).max(99),
  kmPackage: z.enum(["basic", "standard", "unlimited"]).optional(),
  extras: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().min(1),
  })).optional(),
  deliveryAddress: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json().catch(() => null);
  const parsed = reservationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
  }
  const input = parsed.data;

  // 1. Verificar que el vehículo existe en el catálogo
  const vehicle = await getVehicleByCode(input.vehicleId);
  if (!vehicle) {
    return new Response(JSON.stringify({ error: "Vehicle not found" }), { status: 404 });
  }

  const supabase = createServerClient(locals);   // service role (server-only)

  // 2. Verificar disponibilidad (doble check server-side)
  const { data: conflicts } = await supabase
    .from("availability_blocks")
    .select("id")
    .eq("vehicle_id", input.vehicleId)
    .lte("start_date", input.endDate)
    .gte("end_date", input.startDate);

  if ((conflicts ?? []).length > 0) {
    return new Response(
      JSON.stringify({ error: "DATE_CONFLICT", message: "Selected dates are no longer available" }),
      { status: 409 }
    );
  }

  // 3. Calcular precio y congelarlo en el snapshot
  const priceSnapshot = calculatePrice({
    nightlyRateCAD: vehicle.pricePerNightCAD,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
    province: input.guestProvince ?? "AB",
    kmPackageId: input.kmPackage,
    extras: input.extras,
    securityDepositCAD: vehicle.securityDepositCAD,
  });

  // 4. Crear solicitud con status PENDING (sin pago)
  const { data: reservation, error } = await supabase
    .from("reservation_requests")
    .insert({
      vehicle_id: input.vehicleId,
      start_date: input.startDate,
      end_date: input.endDate,
      nights: priceSnapshot.nights,
      km_package: input.kmPackage ?? null,
      extras: JSON.stringify(input.extras ?? []),
      delivery_address: input.deliveryAddress ?? null,
      price_snapshot: JSON.stringify(priceSnapshot),
      status: "PENDING",
      guest_name: input.guestName,
      guest_email: input.guestEmail,
      guest_phone: input.guestPhone ?? null,
      guest_province: input.guestProvince ?? null,
      license_type: input.licenseType ?? null,
      driver_age: input.driverAge,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: "Could not create request" }), { status: 500 });
  }

  // 5. Emails de acuse (opcional: si RESEND_API_KEY está vacío, solo registro en BD)
  await sendReservationRequestEmails(reservation);

  return new Response(
    JSON.stringify({
      success: true,
      reservationId: reservation.id,
      status: "PENDING",
      message: "Reservation request received. We will confirm within 24 hours.",
    }),
    { status: 201 }
  );
};
```

---

## 9. Estado y Data Fetching

### 9.1 Estrategia de fetching

| Dato | Método | Cache | Razón |
|---|---|---|---|
| Landing, fichas, rutas, blog | SSG en build | Build-time (Vercel) | Catálogo versionado en repo |
| Catálogo (para filtros) | Island fetch → `/api/vehicles.json` | 5 min (HTTP) | Filtros client-side |
| Disponibilidad | Island fetch → `/api/availability` | 60 s (HTTP) | Casi tiempo real |
| Verificación de rango | Island fetch → `/api/availability-check` | `no-store` | Consistencia al reservar |
| Solicitud de reserva | Island fetch → `POST /api/reservations` | `no-store` | Mutación |

**Actualización de contenido**: hacer push a `main` dispara rebuild en Vercel (catálogo al día). Para disponibilidad fresca, editar `availability_blocks` en el dashboard de Supabase — visible en ≤60 s sin redeploy.

### 9.2 Zustand Stores (islands)

Los stores se mantienen para el estado del booking flow y filtros dentro de los islands React:

```typescript
// src/stores/booking-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BookingState {
  vehicleId: string | null;
  startDate: string | null;        // "YYYY-MM-DD"
  endDate: string | null;
  kmPackage: "basic" | "standard" | "unlimited" | null;
  extras: Array<{ id: string; quantity: number }>;

  setVehicle: (vehicleId: string) => void;
  setDates: (start: string, end: string) => void;
  setKmPackage: (pkg: BookingState["kmPackage"]) => void;
  toggleExtra: (id: string) => void;
  reset: () => void;
  nights: () => number;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      vehicleId: null,
      startDate: null,
      endDate: null,
      kmPackage: null,
      extras: [],

      setVehicle: (vehicleId) => set({ vehicleId }),
      setDates: (startDate, endDate) => set({ startDate, endDate }),
      setKmPackage: (kmPackage) => set({ kmPackage }),
      toggleExtra: (id) =>
        set((s) => ({
          extras: s.extras.some((e) => e.id === id)
            ? s.extras.filter((e) => e.id !== id)
            : [...s.extras, { id, quantity: 1 }],
        })),
      reset: () => set({ vehicleId: null, startDate: null, endDate: null, kmPackage: null, extras: [] }),

      nights: () => {
        const { startDate, endDate } = get();
        if (!startDate || !endDate) return 0;
        return Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
        );
      },
    }),
    {
      name: "dc-rentals-booking",
      partialize: (s) => ({ vehicleId: s.vehicleId, startDate: s.startDate, endDate: s.endDate }),
    }
  )
);
```

```typescript
// src/stores/filter-store.ts
import { create } from "zustand";

interface FilterState {
  type: string | null;
  sleepCapacity: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  locationId: string | null;
  petFriendly: boolean | null;
  sortBy: "recommended" | "price_asc" | "price_desc" | "length_desc" | "rating";
  viewMode: "grid" | "list";

  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  type: null,
  sleepCapacity: null,
  minPrice: null,
  maxPrice: null,
  locationId: null,
  petFriendly: null,
  sortBy: "recommended",
  viewMode: "grid",

  setFilter: (key, value) => set({ [key]: value }),
  resetFilters: () =>
    set({
      type: null, sleepCapacity: null, minPrice: null,
      maxPrice: null, locationId: null, petFriendly: null,
      sortBy: "recommended",
    }),
}));
```

---

## 10. Calendario de Disponibilidad — Lógica

### 10.1 Generación de días del calendario (función pura)

```typescript
// src/lib/availability.ts

export type DayStatus = "available" | "occupied" | "maintenance" | "past";

export interface BlockRange {
  start_date: string;   // "2026-08-10"
  end_date: string;     // "2026-08-15"
  type: "RESERVATION" | "MAINTENANCE" | "BLOCKED" | "COMING_SOON";
}

export interface CalendarDay {
  date: string;         // "2026-08-15"
  status: DayStatus;
  blockType?: string;
  isPast: boolean;
  isToday: boolean;
}

export function generateCalendarDays(
  year: number,
  month: number,
  months: number,
  blocks: BlockRange[],
  timezone = "America/Toronto"
): CalendarDay[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month - 1 + months, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const days: CalendarDay[] = [];
  const current = new Date(firstDay);

  while (current <= lastDay) {
    const dateStr = fmt(current);
    const isPast = current < today;
    const isToday = current.getTime() === today.getTime();

    const block = blocks.find(
      (b) => dateStr >= b.start_date && dateStr <= b.end_date
    );

    let status: DayStatus;
    if (isPast) status = "past";
    else if (block) status = block.type === "MAINTENANCE" ? "maintenance" : "occupied";
    else status = "available";

    days.push({ date: dateStr, status, blockType: block?.type, isPast, isToday });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Verifica si un rango de fechas está completamente disponible
 */
export function isRangeAvailable(
  startDate: string,
  endDate: string,
  blocks: BlockRange[]
): { available: boolean; conflicts: BlockRange[] } {
  const conflicts = blocks.filter(
    (b) => startDate <= b.end_date && endDate >= b.start_date
  );
  return { available: conflicts.length === 0, conflicts };
}

/**
 * Encuentra la próxima fecha disponible después de una fecha dada
 */
export function findNextAvailable(afterDate: string, blocks: BlockRange[]): string {
  const sorted = [...blocks].sort((a, b) => a.end_date.localeCompare(b.end_date));
  let searchDate = afterDate;

  for (const block of sorted) {
    if (searchDate >= block.start_date && searchDate <= block.end_date) {
      // +1 día después del fin del bloque
      const d = new Date(`${block.end_date}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1);
      searchDate = d.toISOString().split("T")[0];
    }
  }
  return searchDate;
}
```

> Se trabaja con strings `"YYYY-MM-DD"` para evitar problemas de timezone en comparaciones de fechas (lecciones del schema Prisma original con Date objects).

### 10.2 Componente del calendario (React island)

```tsx
// src/components/calendar/availability-calendar.tsx
import { useState, useEffect } from "react";
import type { CalendarDay } from "@/lib/availability";
import { DayCell } from "./day-cell";
import { AvailabilityLegend } from "./availability-legend";

interface AvailabilityCalendarProps {
  vehicleId: string;                    // internalCode
  onDateSelect?: (start: string, end: string) => void;
}

export function AvailabilityCalendar({
  vehicleId,
  onDateSelect,
}: AvailabilityCalendarProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({
      vehicleId,
      year: String(currentYear),
      month: String(currentMonth),
      months: "2",
    });
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((data) => setDays(data.days ?? []))
      .finally(() => setIsLoading(false));
  }, [vehicleId, currentYear, currentMonth]);

  const handleDayClick = (day: CalendarDay) => {
    if (day.status !== "available" || day.isPast) return;

    if (!rangeStart || rangeEnd) {
      setRangeStart(day.date);
      setRangeEnd(null);
    } else if (day.date > rangeStart) {
      setRangeEnd(day.date);
      onDateSelect?.(rangeStart, day.date);
    } else {
      setRangeStart(day.date);
    }
  };

  const prevMonth = () => { /* decrementar mes/año */ };
  const nextMonth = () => { /* incrementar mes/año */ };

  // Grid de 7 columnas (L M X J V S D), DayCell con colores por status,
  // highlight del rango seleccionado, leyenda de estados
  return (
    <section aria-label="Availability calendar" className="rounded-xl border p-4">
      {/* Header con navegación, grid de días, legend */}
      {isLoading ? <p aria-live="polite">Loading...</p> : (
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <DayCell
              key={day.date}
              day={day}
              inRange={!!rangeStart && !!rangeEnd && day.date >= rangeStart && day.date <= rangeEnd}
              onClick={() => handleDayClick(day)}
            />
          ))}
        </div>
      )}
      <AvailabilityLegend />
    </section>
  );
}

export default AvailabilityCalendar;
```

---

## 11. Motor de Precios

Las funciones de precios son **puras y compartidas**: se ejecutan en el island (preview en vivo) y en el server endpoint (cálculo definitivo guardado en `price_snapshot`). Se elimina el import de Prisma `Decimal`.

```typescript
// src/lib/pricing.ts

export const KM_PACKAGES = {
  basic: { km: 400, priceCAD: 150 },
  standard: { km: 800, priceCAD: 300 },
  unlimited: { km: Infinity, priceCAD: 500 },
} as const;

export const EXTRAS_CATALOG = [
  { id: "linen-kit", name: "Linen Kit", nameFr: "Kit de litera", priceCAD: 95, category: "comfort" },
  { id: "kitchen-kit", name: "Kitchen Convenience Kit", nameFr: "Kit cuisine", priceCAD: 75, category: "kitchen" },
  { id: "gas-grill", name: "Portable Gas Grill", nameFr: "BBQ portable", priceCAD: 35, category: "outdoor" },
  { id: "camp-chairs", name: "Camping Chairs (set of 4)", nameFr: "Chaises de camping (jeu de 4)", priceCAD: 40, category: "outdoor" },
  { id: "bike-rack", name: "Bike Rack", nameFr: "Porte-vélos", priceCAD: 30, category: "outdoor" },
  { id: "wifi-hotspot", name: "WiFi Hotspot (5GB)", nameFr: "Hotspot WiFi (5Go)", priceCAD: 10, perDay: true, category: "tech" },
  { id: "smores-kit", name: "S'mores Kit", nameFr: "Kit S'mores", priceCAD: 15, category: "fun" },
  { id: "cooler", name: "Cooler Box", nameFr: "Glacière", priceCAD: 20, category: "kitchen" },
  { id: "outdoor-kit", name: "Premium Outdoor Kit", nameFr: "Kit outdoor premium", priceCAD: 99, category: "bundle" },
] as const;

// Tasas de impuesto por provincia canadiense
export const TAX_RATES: Record<string, { label: string; rate: number }> = {
  AB: { label: "GST", rate: 0.05 },
  BC: { label: "GST + PST", rate: 0.12 },
  MB: { label: "GST + PST", rate: 0.12 },
  NB: { label: "HST", rate: 0.15 },
  NL: { label: "HST", rate: 0.15 },
  NS: { label: "HST", rate: 0.15 },
  ON: { label: "HST", rate: 0.13 },
  PE: { label: "HST", rate: 0.15 },
  QC: { label: "GST + QST", rate: 0.14975 },
  SK: { label: "GST + PST", rate: 0.11 },
  NT: { label: "GST", rate: 0.05 },
  NU: { label: "GST", rate: 0.05 },
  YT: { label: "GST", rate: 0.05 },
};

export const SEASON_MULTIPLIERS = {
  low: { months: [11, 12, 1, 2, 3], multiplier: 0.75 },
  medium: { months: [4, 10], multiplier: 0.95 },
  high: { months: [5, 6, 9], multiplier: 1.0 },
  peak: { months: [7, 8], multiplier: 1.35 },
} as const;

export interface PriceBreakdown {
  nights: number;
  nightlyRateCAD: number;
  baseRateCAD: number;
  kmPackage: { name: string; km: number; priceCAD: number } | null;
  insuranceCAD: number;
  extras: Array<{ name: string; priceCAD: number; quantity: number; isPerDay: boolean }>;
  extrasTotalCAD: number;
  deliveryCAD: number;
  subtotalCAD: number;
  taxLabel: string;
  taxRate: number;
  taxCAD: number;
  totalCAD: number;
  securityDepositCAD: number;
}

export function calculatePrice(params: {
  nightlyRateCAD: number;
  startDate: Date;
  endDate: Date;
  province: string;
  kmPackageId?: string;
  insurancePerDayCAD?: number;
  extras?: Array<{ id: string; quantity: number }>;
  deliveryCAD?: number;
  securityDepositCAD?: number;
}): PriceBreakdown {
  const nights = Math.ceil(
    (params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const baseRateCAD = params.nightlyRateCAD * nights;

  let kmPackage: PriceBreakdown["kmPackage"] = null;
  if (params.kmPackageId && params.kmPackageId in KM_PACKAGES) {
    const pkg = KM_PACKAGES[params.kmPackageId as keyof typeof KM_PACKAGES];
    if ("km" in pkg) {
      kmPackage = { name: params.kmPackageId, km: pkg.km, priceCAD: pkg.priceCAD };
    }
  }

  const insurancePerDay = params.insurancePerDayCAD ?? 25;
  const insuranceCAD = insurancePerDay * nights;

  const extrasBreakdown = (params.extras ?? [])
    .map((e) => {
      const item = EXTRAS_CATALOG.find((c) => c.id === e.id);
      if (!item) return null;
      const isPerDay = "perDay" in item && item.perDay === true;
      return {
        name: item.name,
        priceCAD: isPerDay ? item.priceCAD * e.quantity * nights : item.priceCAD * e.quantity,
        quantity: e.quantity,
        isPerDay,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const extrasTotalCAD = extrasBreakdown.reduce((sum, e) => sum + e.priceCAD, 0);

  const subtotalCAD =
    baseRateCAD +
    (kmPackage?.priceCAD ?? 0) +
    insuranceCAD +
    extrasTotalCAD +
    (params.deliveryCAD ?? 0);

  const taxInfo = TAX_RATES[params.province] ?? TAX_RATES.AB;
  const taxCAD = subtotalCAD * taxInfo.rate;
  const totalCAD = subtotalCAD + taxCAD;

  return {
    nights,
    nightlyRateCAD: params.nightlyRateCAD,
    baseRateCAD,
    kmPackage,
    insuranceCAD,
    extras: extrasBreakdown,
    extrasTotalCAD,
    deliveryCAD: params.deliveryCAD ?? 0,
    subtotalCAD,
    taxLabel: taxInfo.label,
    taxRate: taxInfo.rate,
    taxCAD: Math.round(taxCAD * 100) / 100,
    totalCAD: Math.round(totalCAD * 100) / 100,
    securityDepositCAD: params.securityDepositCAD ?? 1000,
  };
}

export function getSeasonalRate(baseRateCAD: number, date: Date): number {
  const month = date.getMonth() + 1;
  const season = Object.values(SEASON_MULTIPLIERS).find((s) =>
    s.months.includes(month as (typeof SEASON_MULTIPLIERS)["peak"]["months"][number])
  );
  return Math.round(baseRateCAD * (season?.multiplier ?? 1.0) * 100) / 100;
}

export function formatCAD(amount: number, locale: string = "en"): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

---

## 12. Flujo de Reserva (sin pagos) y Módulo de Pagos Futuro

### 12.1 Flujo MVP: solicitud de reserva con confirmación manual

```
┌─────────────────┐   POST /api/reservations   ┌──────────────────┐
│  BookingWidget  │ ──────────────────────────▶ │  Server endpoint │
│  (island React) │                             │  (Vercel FaaS)   │
└─────────────────┘                             └────────┬─────────┘
                                                         │ 1. Validar (Zod)
                                                         │ 2. Verificar disponibilidad (Supabase)
                                                         │ 3. Calcular precio (función pura)
                                                         │ 4. INSERT reservation_requests (PENDING)
                                                         │ 5. Email acuse + notificación (Resend, opcional)
                                                         ▼
                                                ┌──────────────────┐
                                                │    Supabase      │
                                                │ status: PENDING  │
                                                └────────┬─────────┘
                                                         │ Confirmación manual
                                                         ▼ (dashboard Supabase / SQL)
                                                ┌──────────────────┐
                                                │ status: CONFIRMED│
                                                │ + availability_  │
                                                │   block creado   │
                                                └──────────────────┘
```

**Flujo detallado**:

1. **El usuario** selecciona vehículo + fechas en el calendario → el widget muestra el `PriceBreakdown` en vivo (cálculo local, misma función pura).
2. **Envía la solicitud** (`POST /api/reservations`) → validación Zod → doble check de disponibilidad → precio congelado en `price_snapshot` → registro con `status: PENDING`.
3. **Emails** (si `RESEND_API_KEY` está configurado): acuse al cliente + notificación al equipo. Si no, el registro en Supabase es suficiente.
4. **Confirmación manual** (MVP): desde el dashboard de Supabase se cambia el estado a `CONFIRMED` y se crea el `availability_block` (SQL de ejemplo en §4.2). El calendario refleja el bloque en ≤60 s.
5. **Cancelación**: cambiar estado a `CANCELLED` y eliminar el `availability_block` si existe.

**Lo que NO existe en el MVP** (y queda documentado para el futuro):

- ❌ Cobro en línea / Payment Intents de Stripe
- ❌ Webhook de Stripe
- ❌ Reembolsos automáticos
- ❌ Depósito de seguridad cobrado en línea (solo se muestra como información: "se paga al recoger")
- ❌ Autenticación de usuarios (el modelo `User` se elimina del MVP)

### 12.2 Módulo de pagos — implementación futura (DESHABILITADO)

> **Feature flag**: `PUBLIC_ENABLE_PAYMENTS=false`. Todo el bloque de pagos se omite en UI y backend hasta que se active. La UI muestra el CTA **"Request Reservation"** con la nota *"No payment required. We confirm availability within 24h."*

**Diseño previsto para Fase 2 (Stripe)** — sin implementar:

```typescript
// src/lib/payments.ts  (FUTURO — no instalar stripe en el MVP)
//
// import Stripe from "stripe";
// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
//
// Flujo previsto:
// 1. POST /api/reservations crea la reserva PENDING (actual flujo, se conserva)
// 2. Cuando PUBLIC_ENABLE_PAYMENTS=true, el endpoint además crea un
//    PaymentIntent con metadata.reservationId y retorna clientSecret
// 3. El BookingWidget renderiza <PaymentElement /> de @stripe/stripe-js
// 4. Webhook payment_intent.succeeded → UPDATE status=CONFIRMED + crear
//    availability_block + email (misma lógica que la confirmación manual actual)
// 5. payment_intent.payment_failed → UPDATE status=CANCELLED
//
// Variables futuras a agregar en .env:
//   STRIPE_SECRET_KEY, PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
//
// Migración prevista en reservation_requests:
//   alter table reservation_requests add column stripe_payment_intent_id text;
//   alter table reservation_requests add column paid_at timestamptz;
```

**Consideraciones al activarlo en el futuro**:

- El flujo manual actual se conserva como fallback (flag apagado = flujo manual).
- El `price_snapshot` en JSONB ya permite cobrar el monto exacto congelado.
- El webhook de Stripe necesita el adaptador de Vercel en modo serverless (`prerender = false`) — ya configurado en los endpoints.
- Ver [ADR-011](#adr-011-pagos-deshabilitados-en-el-mvp).

---

## 13. Imágenes y Media

### 13.1 Astro Assets (imágenes locales) + Cloudinary (remotas)

Astro optimiza imágenes locales con `astro:assets` (sharp incluido) y sirve WebP/AVIF automáticamente:

```astro
---
// Ejemplo: imagen local optimizada
import { Image } from "astro:assets";
import heroImage from "../../public/images/hero/mountains.jpg";
---
<Image
  src={heroImage}
  alt="Canadian Rockies at sunset"
  widths={[640, 1080, 1920]}
  sizes="100vw"
  class="w-full object-cover"
/>
```

Para imágenes remotas de Cloudinary se usa el helper:

```typescript
// src/lib/images.ts
const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;

export function getCloudinaryUrl(
  publicId: string,
  options: { width?: number; quality?: number; crop?: "fill" | "fit" | "limit" } = {}
): string {
  const { width = 800, quality = 80, crop = "fit" } = options;
  const transformations = [
    `w_${width}`, `q_${quality}`, "f_auto", `c_${crop}`, "dpr_auto",
  ].join(",");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}

export const IMAGE_SIZES = {
  thumbnail: { width: 400, quality: 70 },
  card: { width: 600, quality: 75 },
  detail: { width: 1200, quality: 80 },
  hero: { width: 1920, quality: 85 },
} as const;
```

> **MVP**: se recomienda usar **imágenes locales en `public/`** (ya que el catálogo está en el repo y el volumen es manejable). Cloudinary queda como opción si el catálogo crece o se necesita upload dinámico.

### 13.2 Convención de naming para imágenes

```
/public/images/vehicles/
  DC-C3-001/           # internalCode del vehículo
    exterior-01.webp
    exterior-02.webp
    kitchen-01.webp
    bathroom-01.webp
    bedroom-01.webp
    living-01.webp
    floorplan.svg      # (o en /public/floorplans/)
```

### 13.3 Headers de caché

Los headers se configuran en `vercel.json` (sección 17). Astro sirve los assets optimizados con hashes content-addressed.

---

## 14. SEO — Implementación Técnica

### 14.1 `<head>` con metadata por página

```astro
---
// src/components/shared/seo-head.astro
interface Props {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  locale: "en" | "fr";
  alternates?: Record<string, string>;   // { en: "...", fr: "..." }
}

const { title, description, canonical, image, locale, alternates } = Astro.props;
const ogLocale = locale === "fr" ? "fr_CA" : "en_CA";
---

<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
{alternates && Object.entries(alternates).map(([lang, href]) => (
  <link rel="alternate" hreflang={lang === "fr" ? "fr-CA" : "en-CA"} href={href} />
))}
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
{image && <meta property="og:image" content={image} />}
<meta property="og:locale" content={ogLocale} />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

### 14.2 Schema.org (JSON-LD)

```astro
---
// src/components/shared/json-ld.astro
interface Props {
  schema: Record<string, unknown>;
}
const { schema } = Astro.props;
---
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

```typescript
// src/lib/seo.ts
export function vehicleJsonLd(vehicle: VehicleSummary, locale: string) {
  const baseUrl = import.meta.env.PUBLIC_SITE_URL;
  const prefix = locale === "fr" ? "/fr/vehicules" : "/en/vehicles";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: vehicle.name,
    description: vehicle.description,
    image: vehicle.mainImage,
    brand: { "@type": "Brand", name: vehicle.brand },
    url: `${baseUrl}${prefix}/${vehicle.slug}`,
    offers: {
      "@type": "Offer",
      price: vehicle.pricePerNightCAD,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
    },
  };
}
```

### 14.3 Sitemap

Se usa la integración `@astrojs/sitemap` (añadida en `astro.config.mjs`) con soporte de i18n. Las páginas SSG se incluyen automáticamente. Para páginas dinámicas dependientes de BD, se puede generar un sitemap custom en `src/pages/sitemap.xml.ts` leyendo Content Collections y `availability_blocks`.

---

## 15. Testing

### 15.1 Configuración (Vitest)

Astro funciona mejor con **Vitest** que con Jest (nativo de Vite):

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",           // la lógica de negocio es pura (sin DOM)
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
    },
  },
});
```

E2E con Playwright (`@playwright/test`) para el flujo de solicitud de reserva contra un preview de Vercel o `astro dev`.

### 15.2 Tests unitarios críticos

Los tests de precios y disponibilidad se **conservan igual** (son funciones puras, no dependen de framework):

```typescript
// tests/unit/pricing.test.ts
import { describe, it, expect } from "vitest";
import { calculatePrice, getSeasonalRate } from "@/lib/pricing";

describe("calculatePrice", () => {
  it("calculates basic 5-night booking correctly", () => {
    const result = calculatePrice({
      nightlyRateCAD: 189,
      startDate: new Date("2026-08-15"),
      endDate: new Date("2026-08-20"),
      province: "AB",
      kmPackageId: "standard",
      insurancePerDayCAD: 25,
      securityDepositCAD: 1000,
    });

    expect(result.nights).toBe(5);
    expect(result.baseRateCAD).toBe(945);
    expect(result.kmPackage?.priceCAD).toBe(300);
    expect(result.insuranceCAD).toBe(125);
    expect(result.subtotalCAD).toBe(1370);
    expect(result.taxRate).toBe(0.05);        // Alberta GST
    expect(result.taxCAD).toBe(68.5);
    expect(result.totalCAD).toBe(1438.5);
  });

  it("calculates Quebec taxes correctly", () => {
    const result = calculatePrice({
      nightlyRateCAD: 200,
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-08"),
      province: "QC",
    });
    expect(result.taxRate).toBe(0.14975);
    expect(result.taxLabel).toBe("GST + QST");
  });
});

describe("getSeasonalRate", () => {
  it("applies peak multiplier in July", () => {
    expect(getSeasonalRate(189, new Date("2026-07-15"))).toBe(255.15);
  });
  it("applies low season multiplier in January", () => {
    expect(getSeasonalRate(189, new Date("2026-01-15"))).toBe(141.75);
  });
});
```

```typescript
// tests/unit/availability.test.ts
import { describe, it, expect } from "vitest";
import { isRangeAvailable, findNextAvailable } from "@/lib/availability";

describe("isRangeAvailable", () => {
  it("returns available when no conflicts", () => {
    const result = isRangeAvailable(
      "2026-08-01", "2026-08-07",
      [{ start_date: "2026-08-10", end_date: "2026-08-15", type: "RESERVATION" }]
    );
    expect(result.available).toBe(true);
  });

  it("returns unavailable when range overlaps", () => {
    const result = isRangeAvailable(
      "2026-08-05", "2026-08-12",
      [{ start_date: "2026-08-10", end_date: "2026-08-15", type: "RESERVATION" }]
    );
    expect(result.available).toBe(false);
    expect(result.conflicts).toHaveLength(1);
  });
});

describe("findNextAvailable", () => {
  it("returns day after block ends", () => {
    const result = findNextAvailable(
      "2026-08-12",
      [{ start_date: "2026-08-10", end_date: "2026-08-15", type: "RESERVATION" }]
    );
    expect(result).toBe("2026-08-16");
  });
});
```

### 15.3 Test de schema de contenido

```typescript
// tests/unit/content-schema.test.ts
import { describe, it, expect } from "vitest";
import { getCollection } from "astro:content";

// Validación automática: si un JSON de vehículo no cumple el schema Zod,
// astro build falla. Este test replica esa validación en CI.
describe("vehicle content entries", () => {
  it("all vehicles have unique internalCode and slug", async () => {
    const vehicles = await getCollection("vehicles");
    const codes = vehicles.map((v) => v.data.internalCode);
    const slugs = vehicles.map((v) => v.data.slug);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
```

---

## 16. Convenciones de Código

### 16.1 Naming conventions

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes Astro | kebab-case | `vehicle-card.astro` |
| Componentes React | kebab-case | `availability-calendar.tsx` |
| Pages | kebab-case | `[slug].astro`, `availability.ts` |
| Hooks | camelCase, prefijo `use` | `use-vehicle-filters.ts` |
| Utilidades | camelCase | `pricing.ts` |
| Tipos/Interfaces | PascalCase, sufijo descriptivo | `VehicleSummary`, `BookingState` |
| Content entries | kebab-case | `dc-c3-001.json`, `rocky-mountains.en.mdx` |
| Variables CSS | kebab-case | `--color-primary` |
| Constantes | SCREAMING_SNAKE | `KM_PACKAGES`, `TAX_RATES` |
| Tablas Supabase | snake_case | `availability_blocks`, `reservation_requests` |
| i18n keys | snake_case anidado | `booking.request_now` |

### 16.2 Reglas de ESLint

```json
// .eslintrc.json
{
  "extends": [
    "astro/base",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "jsx-a11y"],
  "parserOptions": {
    "extraFileExtensions": [".astro"]
  },
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  },
  "overrides": [
    {
      "files": ["*.astro"],
      "parser": "astro-eslint-parser"
    }
  ]
}
```

### 16.3 Git conventions

```
# Commits: Conventional Commits (sin cambios)
feat: add vehicle detail page with specs
fix: calendar showing past dates as available
refactor: extract pricing logic to pure module
docs: add Supabase schema documentation
test: add pricing calculation unit tests
chore: configure Astro i18n routing

# Branches
feat/vehicle-catalog
feat/reservation-request
fix/calendar-availability
release/v1.0.0
```

---

## 17. Configuración de Deploy — Vercel Hobby

### 17.1 Plan gratuito de Vercel — restricciones y cómo cumplirlas

| Restricción Vercel Hobby | Impacto en el proyecto | Mitigación |
|---|---|---|
| **Functions**: 125 GB-horas de invocación/mes | Los endpoints (`/api/*`) solo se invocan en interacción (calendario, reserva) | Tráfico de landing = 0 funciones; volumen holgado |
| **Function timeout**: 10 s (Hobby) | Queries Supabase sencillas (<100 ms) | Sin problemas; no hacer operaciones largas |
| **Cron Jobs**: disponibles con limitaciones | Se eliminan los crons del MVP (expiración de reservas y notificaciones) | Procesos manuales/SQL en MVP; migrar a Supabase Edge Functions o cron futuro |
| **Builds**: 6 h/mes de build | Build de Astro es rápido (~1-2 min) | Holgado para deploy por commit |
| **Bandwidth**: 100 GB/mes | Imágenes optimizadas y estáticas | Cumple el performance budget (§19) |
| **Sin middleware edge extenso** | El redirect de idioma se hace en `index.astro` | Ya contemplado en §7.1 |

### 17.2 `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "astro",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/images/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/_astro/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

> **Nota**: no se requiere `buildCommand` especial; Vercel detecta Astro automáticamente y ejecuta `astro build` con el adaptador `@astrojs/vercel/serverless` (ya configurado en `astro.config.mjs`).

### 17.3 Supabase — plan gratuito

- **Free tier**: 500 MB de base de datos, 5 GB egress/mes, 2 proyectos, backups de 7 días (sin PITR).
- **Setup inicial**: crear proyecto → `npm run db:login` + `npm run db:link` (una vez) → `npm run db:push` (aplica `supabase/migrations/`, ADR-021) → copiar URL, anon key y service role key al `.env` y a las env vars de Vercel.
- **Sin connection pooling issues**: `@supabase/supabase-js` usa HTTP (PostgREST), no conexiones directas de Postgres — sin problemas de pgbouncer en serverless.

### 17.4 GitHub Actions (CI)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check   # astro check
      - run: npm run test         # vitest
      - run: npm run build        # astro build (valida Content Collections)
```

---

## 18. Accesibilidad — Checklist Técnico

| Requisito | Implementación | Verificación |
|---|---|---|
| Contraste 4.5:1 | Tailwind colors validados con tool | axe DevTools |
| Navegación por teclado | `tabindex`, `onKeyDown` en islands interactivos | Tab testing manual |
| ARIA labels | `aria-label`, `aria-describedby` en inputs, botones | Lighthouse |
| Alt text imágenes | Campos `alt`/`altFr` en el schema de la colección vehicles, obligatorios | Screen reader |
| Labels de formulario | `<label for>` asociado a cada input del BookingWidget | axe DevTools |
| Skip links | `<a href="#main-content">Skip to content</a>` en `layout.astro` | Tab testing |
| Focus visible | `focus-visible:ring-2 ring-brand-primary` en todos los interactivos | Tab testing |
| Reduced motion | `motion-safe:` / `motion-reduce:` en transiciones CSS | `prefers-reduced-motion` |
| Zoom 200% | Layout fluido, sin overflow horizontal | Browser zoom |
| Screen reader | HTML semántico nativo de Astro (`<nav>`, `<main>`, `<article>`, `<aside>`) | VoiceOver / NVDA |
| Error messages | `aria-live="polite"` en mensajes de error del formulario | Screen reader |
| Iconos | `aria-hidden="true"` en decorativos (`lucide-react` soporta `aria-hidden` por defecto) | Screen reader |
| Island hydration | Islands con `client:visible` no deben ocultar contenido con `display:none` antes de hidratar | Tab testing |

---

## 19. Performance Budget

| Recurso | Límite | Estrategia |
|---|---|---|
| JS total (initial) | < 60 KB gzipped | Astro islands cero-JS por defecto; solo los islands cargan JS |
| CSS total | < 30 KB gzipped | Tailwind purge |
| Hero image | < 200 KB (WebP) | `astro:assets` responsive, `widths` + `sizes` |
| Vehicle card image | < 80 KB (WebP) | 600px, quality 75 |
| Fonts | < 100 KB total | Subset latin, `font-display: swap`, preload |
| Páginas estáticas (landing, fichas, blog) | LCP < 2.0s | HTML pre-renderizado en build (SSG), sin TTFB de servidor dinámico |
| Islas interactivas | INP < 200ms | `client:visible` para carga diferida; calendario/booking se hidratan al entrar en viewport |
| CLS | < 0.1 | Dimensiones explícitas en imágenes (`width`/`height`), font preload |
| TTFB (páginas SSG) | < 200ms | Edge network de Vercel, HTML estático |
| TTFB (endpoints API) | < 600ms | Serverless en `iad1` + Supabase (mismo region recommended: us-east-1) |

### Monitoring

```typescript
// src/components/shared/web-vitals.tsx — Web Vitals reporting (island mínimo)
import { useWebVitals } from "@/hooks/use-web-vitals";

export function WebVitals() {
  useWebVitals((metric) => {
    if (import.meta.env.PROD) {
      fetch("/api/vitals", {
        method: "POST",
        body: JSON.stringify(metric),
        keepalive: true,
      }).catch(() => {});
    }
  });
  return null;
}
```

> **Ganancia clave del cambio a Astro**: las páginas de contenido (landing, catálogo, fichas, blog, FAQ) son HTML estático servido desde CDN — el JS de hydration solo existe en los islands (calendario, filtros, formulario de reserva). El presupuesto inicial baja de 150 KB a ~60 KB.

---

## 20. Decisiones Técnicas Clave (ADR)

### ADR-001: Astro vs Next.js

**Decisión**: Astro (modo híbrido: SSG + server endpoints)
**Razón**: La app es fundamentalmente un sitio de contenido/marketing con muy poca interactividad (calendario y formulario). Astro entrega HTML estático cero-JS por defecto, con islands React solo donde hay interacción — mejor performance (LCP, presupuesto de JS) y menor costo en Vercel Hobby que un runtime SSR completo. El file-based routing, i18n y sitemap son nativos.

### ADR-002: Server Endpoints REST vs tRPC

**Decisión**: Endpoints REST nativos de Astro (`src/pages/api/*.ts`) con validación Zod
**Razón**: tRPC está acoplado a Next.js y React Query; para 4 endpoints simples añade dependencias innecesarias. Los endpoints Astro son serverless functions con `prerender = false`, validación Zod compartida entre front y back, y contratos JSON simples documentados en §8.

### ADR-003: Supabase + Content Collections vs Prisma/Postgres gestionado

**Decisión**: Content Collections (catálogo en archivos) + Supabase (datos dinámicos, plan Free)
**Razón**: El catálogo (vehículos, rutas, blog) cambia por deploy y se beneficia de versionado en git (PRs, reviews, historial). Solo disponibilidad y solicitudes de reserva necesitan escritura en runtime, y eso entra cómodo en el Free tier de Supabase. Se elimina el connection pooling problemático de Prisma en serverless (supabase-js usa HTTP). Sin costo de infraestructura en las primeras fases.

### ADR-004: i18n nativo de Astro vs next-intl

**Decisión**: i18n integrado de Astro + helper `t()` ligero
**Razón**: Astro tiene routing i18n nativo (`[locale]`, `prefixDefaultLocale`, sitemap i18n). El volumen de strings de UI es pequeño; un helper con JSON simple cubre el MVP sin dependencias. El contenido bilingüe se resuelve en las colecciones (campos `*Fr` o entradas por locale).

### ADR-005: Tailwind + componentes Astro vs shadcn/ui

**Decisión**: Tailwind + componentes `.astro` propios
**Razón**: shadcn/ui está orientado a React; con Astro la mayoría de componentes son HTML estático donde un `.astro` component es más ligero (cero JS). Los pocos componentes interactivos reutilizan patrones de shadcn a mano en React islands.

### ADR-006: Mapbox vs Google Maps

**Decisión**: Mapbox GL JS (sin cambios respecto a la versión anterior)
**Razón**: Mejor rendering WebGL, mapas personalizados de Canadá, pricing predecible. Se carga como island con `client:visible` para no penalizar el LCP.

### ADR-007: Imágenes locales (astro:assets) + Cloudinary opcional

**Decisión**: `astro:assets` con sharp para el catálogo del repo; Cloudinary como opción futura si crece el volumen
**Razón**: El catálogo está versionado en el repo, así que las imágenes pueden vivir en `public/` y `astro:assets` las optimiza en build (WebP/AVIF, srcset automático) sin costo de CDN externo. Cloudinary se reserva para uploads dinámicos o un panel de admin futuro.

### ADR-008: Zustand para estado de islands

**Decisión**: Zustand (sin cambios)
**Razón**: Mínimo boilerplate, funciona perfectamente dentro de islands React sin providers, persist middleware para sobrevivir navegación. Para estado muy local, usar `useState` directo.

### ADR-009: Single repo

**Decisión**: Single repo (Astro + SQL de Supabase versionado en `supabase/`)
**Razón**: Fase 1 es una landing con poca lógica dinámica. El schema SQL versionado en el repo da trazabilidad de cambios de BD sin herramientas adicionales.

### ADR-010: SSG + fetch en islands vs ISR/SSR

**Decisión**: SSG para todo el contenido + fetch client-side (con caché HTTP) para datos dinámicos
**Razón**: El catálogo cambia por commit (rebuild automático en Vercel por push). La disponibilidad necesita frescura ≤60 s y se obtiene por fetch al endpoint. No hay páginas que requieran SSR por request — el TTFB es el de un CDN. Si en el futuro se necesita frescura sin rebuild, migrar páginas de catálogo a server endpoints con `prerender = false`.

### ADR-011: Pagos deshabilitados en el MVP

**Decisión**: Flujo de **solicitud de reserva sin pago** (status `PENDING` → confirmación manual → `CONFIRMED`); Stripe queda documentado como implementación futura tras el flag `PUBLIC_ENABLE_PAYMENTS`
**Razón**: El módulo de pagos añade complejidad regulatoria (carga de tarjeta, webhooks, reembolsos, PCI) que no es necesaria para validar el producto. El flujo manual permite operar el negocio desde el día 1 con cero configuración externa. El schema (`price_snapshot` en JSONB, estados de reserva) y el endpoint `POST /api/reservations` están diseñados para enchufar Stripe sin migraciones destructivas (ver §12.2).

---

> **Última actualización**: Octubre 2026 — v2 (migración Next.js → Astro, Supabase + Content Collections, sin pagos, Vercel Hobby)
> **Autor**: DC Rentals — Especificación Técnica de Implementación
> **Estado**: Borrador — Complemento de LANDING-PAGE.md
