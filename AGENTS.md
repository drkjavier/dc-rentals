# AGENTS.md — DC Rentals

## Visión General

Este proyecto es una aplicación web **DC Rentals** (alquiler de RVs en Canadá) construida con:
- **Astro** (modo híbrido: SSG + serverless endpoints)
- **React islands** para interactividad (calendario, filtros, booking)
- **Tailwind CSS** para estilos
- **Content Collections + Supabase** como base de datos
- **Sin módulo de pagos** en el MVP (reservas con confirmación manual)

## Arquitectura de Agentes

```
┌──────────────────────────────────────────────────────────────────┐
│                    dc-rentals-orchestrator                       │
│         (entry point, GGVR, decide 1 o N agentes)               │
└──────────────────────┬───────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ dc-rentals-    │ │ dc-rentals-    │ │ dc-rentals-     │
│ web-dev        │ │ business-logic │ │ data-ops        │
│                 │ │                 │ │                 │
│ Frontend        │ │ Pricing engine  │ │ Content/DB      │
│ Astro/React UI  │ │ API REST        │ │ Testing          │
│ SEO/i18n        │ │ Availability    │ │ CI/CD            │
│ Components       │ │ Zustand stores  │ │ Supabase         │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Metodología SDD + TDD con GGVR (AC/DC)

**TODAS las tareas** deben seguir este ciclo sin excepciones:

| Fase | Descripción |
|------|-------------|
| **1. GUIAR** | Leer AGENTS.md, estados actuales, historial de sesión |
| **2. SPEC** | Cerrar alcance, Gherkin specs (Feature + Background + happypath/sadpath) |
| **3. DESIGN** | Archivos a crear/modificar, orden, riesgos |
| **4. DEVELOP** | TODO list atómico (ID, Nombre, Descripción, Consideraciones, Estado, Timestamp, Agente) |
| **5. VERIFY** | Lint + typecheck + tests + checklist manual |
| **6. DELIVER** | Resumen + archivos + decisiones técnicas |

## Decisiones Técnicas Clave (ADR)

| ADR | Decisión |
|-----|----------|
| ADR-001 | Astro (híbrido SSG + server endpoints) vs Next.js |
| ADR-002 | Server Endpoints REST vs tRPC |
| ADR-003 | Content Collections + Supabase vs Prisma |
| ADR-004 | i18n nativo de Astro vs next-intl |
| ADR-005 | Tailwind + componentes Astro propios vs shadcn/ui |
| ADR-006 | Mapbox vs Google Maps |
| ADR-007 | Imágenes locales (astro:assets) + Cloudinary opcional |
| ADR-008 | Zustand para estado de islands |
| ADR-009 | Single repo |
| ADR-010 | SSG + fetch en islands vs ISR/SSR |
| ADR-011 | Pagos deshabilitados en MVP (Stripe como futuro) |

## Convenciones de Código

### Naming

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Componentes Astro | kebab-case | `vehicle-card.astro` |
| Componentes React | kebab-case | `availability-calendar.tsx` |
| Pages | kebab-case | `[slug].astro` |
| Hooks | camelCase, prefijo `use` | `use-vehicle-filters.ts` |
| Tipos/Interfaces | PascalCase | `VehicleSummary`, `BookingState` |
| Content entries | kebab-case | `dc-c3-001.json` |
| Variables CSS | kebab-case | `--color-primary` |
| Constantes | SCREAMING_SNAKE | `KM_PACKAGES` |
| Tablas Supabase | snake_case | `availability_blocks` |
| i18n keys | snake_case anidado | `booking.request_now` |

### Reglas Absolutas

1. **Astro por defecto**: Componentes sin estado/interacción = `.astro` (cero JS)
2. **React island solo cuando necesario**: `client:load`, `client:visible`, `client:idle`
3. **Nunca secrets en código**: Variables de entorno `PUBLIC_*` para browser
4. **Nunca SQL directo en endpoints**: Usar Supabase JS client
5. **Feature flag PUBLIC_ENABLE_PAYMENTS=false**: No implementar Stripe
6. **Dates como strings YYYY-MM-DD**: Evitar Date objects para comparaciones
7. **price_snapshot en JSONB**: Siempre congelar PriceBreakdown en reservas
8. **RLS en todas las tablas Supabase**
9. **Tests para lógica pura**: pricing.ts y availability.ts tienen tests unitarios

## Estructura de Archivos Clave

```
dc-rentals/
├── src/
│   ├── components/        # UI (web-dev)
│   ├── pages/             # Routing (web-dev)
│   ├── lib/               # Lógica negocio (business-logic)
│   │   ├── pricing.ts     # ⚠️ función pura, sin side effects
│   │   ├── availability.ts # ⚠️ función pura, sin side effects
│   │   ├── supabase.ts    # server-only (service role)
│   │   └── content.ts     # helpers de Content Collections
│   ├── stores/            # Zustand (business-logic)
│   ├── hooks/             # React hooks (web-dev)
│   └── content/           # Content Collections (data-ops)
├── supabase/
│   └── schema.sql         # ⚠️ solo migraciones additive
├── tests/
│   ├── unit/              # (data-ops)
│   └── e2e/               # (data-ops)
└── .opencode/
    ├── agents/            # Definiciones de agentes
    └── executions/        # TODO lists históricos
```

## Performance Budget

| Recurso | Límite | Estrategia |
|---------|--------|------------|
| JS total (initial) | < 60 KB gzipped | Astro islands cero-JS por defecto |
| CSS total | < 30 KB gzipped | Tailwind purge |
| Hero image | < 200 KB (WebP) | `astro:assets` responsive |
| Vehicle card image | < 80 KB (WebP) | 600px, quality 75 |
| Fonts | < 100 KB total | Subset latin, `font-display: swap` |

## Environments

| Variable | Descripción |
|----------|-------------|
| `PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Solo lectura pública (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, NUNCA al browser |
| `PUBLIC_ENABLE_PAYMENTS` | `false` en MVP |
| `RESEND_API_KEY` | Opcional, vacío = sin emails |

## Comandos Útiles

```bash
# Development
npm run dev

# Build & Validate
npm run build
npm run lint
npm run type-check

# Tests
npm run test              # unit tests
npx playwright test       # e2e tests

# Content Collections validation
astro build
```

## Registro de Agentes

| Agente | Archivo | Color |
|--------|---------|-------|
| Orchestrator | `dc-rentals-orchestrator.md` | `#1E40AF` |
| Web Dev | `dc-rentals-web-dev.md` | `#059669` |
| Business Logic | `dc-rentals-business-logic.md` | `#D97706` |
| Data Ops | `dc-rentals-data-ops.md` | `#7C3AED` |

---

*Última actualización: Octubre 2026 — v2*
