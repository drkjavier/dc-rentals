# Ejecución: DC Rentals — Landing Page MVP (Fase 1 + 2 del roadmap)

> **Fecha**: 2026-10-14
> **CR/Tarea**: Construcción del MVP completo según `TECHNICAL-SPEC.md` v2 (SDD) y `LANDING-PAGE.md`
> **Decisiones de alcance (aprobadas por Orquestador)**:
> 1. Alcance: MVP completo (setup + design system + catálogo bilingüe + landing + fichas + calendario + solicitud de reserva + 4 endpoints + SEO + CI).
> 2. Supabase: código completo (schema.sql, seed.sql, clientes, endpoints) con **degradación graceful** sin env vars (calendario → todos available; POST reservations → 503 `DATABASE_NOT_CONFIGURED`).
> 3. Imágenes: **placeholders SVG locales** en `public/images/` con la convención de naming §13.2 (se sustituyen por fotos reales sin tocar código).
> 4. Git inicializado con commits convencionales por fase (§16.3).

## DESIGN — Archivos a crear, orden y riesgos

**Orden de implementación** (cada paso desbloquea al siguiente):

1. **Scaffold** (package.json, astro.config.mjs, tsconfig.json, .env.example, .gitignore) → git init
2. **Tooling** (tailwind.config.mjs, src/styles/globals.css, .prettierrc, .eslintrc.json, vitest.config.ts, tests/setup.ts)
3. **i18n** (`src/lib/i18n.ts` + `public/locales/{en,fr}/common.json`) — TDD (`t()`, `localizedPath()`)
4. **Design system** (`src/components/ui/*`, `src/components/layout/*`)
5. **Contenido** (`src/lib/content-schemas.ts` (Zod, importable por tests), `src/content.config.ts`, `src/content/vehicles/*.json` ×4, `src/content/routes/*.mdx` ×3 EN+FR, `src/content/faq/faq.json`, `src/lib/locations.ts`, placeholders SVG) → helpers `src/lib/content.ts` + tests de unicidad
6. **Lógica de negocio** — TDD: `src/lib/pricing.ts`, `src/lib/availability.ts`
7. **API** (`src/lib/validation.ts`, `src/lib/supabase.ts`, `src/lib/supabase-browser.ts`, `src/lib/email.ts`, 4 endpoints en `src/pages/api/`) + tests de contrato
8. **Páginas SSG** (landing, catálogo, ficha, FAQ, rutas) + componentes `src/components/vehicle/*`, `src/components/landing/*`, `src/components/shared/*` (seo-head, json-ld)
9. **Islas React** (`src/stores/*`, booking widget + price breakdown, calendario de disponibilidad, filtros de catálogo) + tests con Testing Library
10. **Deploy/CI** (`.github/workflows/ci.yml`, `vercel.json`, robots/sitemap)
11. **VERIFY** (lint + type-check + unit tests + build) y **DELIVER**

**Riesgos identificados y mitigación**:

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Astro 5 elimina `output: "hybrid"` y `@astrojs/tailwind` | Desvío del SDD | Fijar Astro ^4.16 + @astrojs/vercel^7 (compatibles con el SDD tal cual está escrito). Sin ADR. |
| `astro:content` no es testeable en Vitest puro | Tests de catálogo | Schemas Zod en `src/lib/content-schemas.ts` (compartido con content.config.ts); tests leen los JSON con fs. Decisión operativa registrada. |
| Sin credenciales Supabase | Endpoints no probables E2E | Degradación graceful + tests de contrato con `vi.mock` del cliente Supabase |
| Pantallas Tailwind del spec reemplazan sm/lg (§1.2 vs §6.1) | Clases muertas | Definir alias `tablet/desktop/wide` en `extend` conservando defaults sm/md/lg/xl |
| Playwright requiere descarga de browsers | CI/E2E local | Config presente + smoke test; ejecución opcional según red |
| Fuentes Google (Inter/Jakarta/JetBrains) offline | Fallback tipográfico | `<link>` con `font-display: swap` + stack system-ui de fallback |

**Deuda técnica documentada** (ver `reports/decisions.md`): astro-seo omitido (SeoHead propio §14.1); Filtros de catálogo como island ligero (MVP); reseñas (ReviewList) fuera del MVP (spec v2 las difiere a Fase futura).

## TODO List

| ID | Nombre | Descripción | Consideraciones | Estado | Timestamp finalizada | Agente |
|---|---|---|---|---|---|---|
| EJ-01 | Scaffold del proyecto | package.json, deps (Astro 4, React, Tailwind, Zod, Supabase, Vitest…), astro.config.mjs (hybrid + i18n + sitemap), tsconfig.json, .env.example (§3), .gitignore, git init + commit inicial | Sin `stripe`/`prisma`/`tRPC` (ADR-011); alias `@` → src; site=dc-rentals.ca | completada | 2026-10-15T01:26:23Z | @foundation |
| EJ-02 | Tooling: Tailwind, lint, format, Vitest | tailwind.config.mjs (tokens §6 + screens), globals.css (CSS vars §6.1), .prettierrc, .eslintrc.json (§16.2), vitest.config.ts + tests/setup.ts, scripts npm (dev/build/lint/type-check/test) | Alias tablet/desktop/wide en extend; lint debe pasar limpio | completada | 2026-10-15T01:31:00Z | @foundation |
| EJ-03 | i18n helpers (TDD) | src/lib/i18n.ts: `t()`, `localizedPath()`, localeConfig, defaultLocale; public/locales/en/common.json y fr/common.json (nav, hero, booking, common, catalog, faq) | TDD red→green; claves snake_case anidadas; FR completo | completada | 2026-10-15T01:32:00Z | @foundation |
| EJ-04 | Design system y layout | src/components/ui/: button, badge, card, input, container; src/components/layout/: header, footer, language-switcher (island), skip link, html lang/og locale | Checklist a11y §18 (focus-visible, contraste, motion-reduce); cero JS en .astro | completada | 2026-10-15T01:40:00Z | @ui-design |
| EJ-05 | Content schemas + contenido de ejemplo | src/lib/content-schemas.ts (Zod §4.1), src/content.config.ts, 4 vehículos JSON (DC-C3-001 Calgary, DC-CB-002 Vancouver, DC-TT-003 Toronto, DC-CA-004 Montreal), 3 rutas MDX EN+FR, faq.json EN+FR, src/lib/locations.ts | internalCode regex, slug kebab, specs completas dual métrico/imperial, status variados (AVAILABLE/OCCUPIED/COMING_SOON) | completada | 2026-10-15T01:52:00Z | @catalog |
| EJ-06 | Placeholders SVG | public/images/hero/, vehicles/<CODE>/ (exterior/kitchen/bathroom/bedroom/living .svg), routes/, public/floorplans/<code>.svg | Convención §13.2; sufijo .svg en vez de .webp (fotos reales después) | completada | 2026-10-15T01:55:00Z | @catalog |
| EJ-07 | Content helpers + tests | src/lib/content.ts: getVehiclesForApi, getVehicleBySlug, getVehicleByCode, getSimilarVehicles, getRoutes/getRoute, getFaq por locale; tests: unicidad slug/internalCode, schema válido, helpers | Tests leen JSON con fs (sin astro:content en Vitest) | completada | 2026-10-15T01:56:00Z | @catalog |
| EJ-08 | Motor de precios (TDD) | src/lib/pricing.ts §11: KM_PACKAGES, EXTRAS_CATALOG, TAX_RATES, SEASON_MULTIPLIERS, calculatePrice, getSeasonalRate, formatCAD | TDD: tests de pricing.test.ts primero; tolerancia ±0.01; fallback AB | completada | 2026-10-15T01:58:00Z | @api-data |
| EJ-09 | Lógica de disponibilidad (TDD) | src/lib/availability.ts §10.1: generateCalendarDays, isRangeAvailable, findNextAvailable | TDD: availability.test.ts; fechas como strings YYYY-MM-DD | completada | 2026-10-15T02:01:00Z | @api-data |
| EJ-10 | Validación + clientes Supabase + email | src/lib/validation.ts (schemas Zod compartidos), src/lib/supabase.ts (service role server), src/lib/supabase-browser.ts (anon), src/lib/email.ts (Resend opcional), supabase/schema.sql + seed.sql (§4.2) | SERVICE_ROLE nunca en browser; RLS §4.2; email degrada sin API key | completada | 2026-10-15T02:05:00Z | @api-data |
| EJ-11 | Endpoints API + tests de contrato | src/pages/api/: vehicles.json.ts, availability.ts, availability-check.ts, reservations.ts (§8); prerender=false; tests con vi.mock de supabase/content | 400 validación, 404 vehículo, 409 DATE_CONFLICT, 503 DB no configurada; cache headers §9.1 | completada | 2026-10-15T02:08:00Z | @api-data |
| EJ-12 | Landing page + secciones | [locale]/index.astro + src/components/landing/: hero-section, how-it-works, featured-vehicles, popular-routes, testimonials, cta-section; index.astro raíz con redirect Accept-Language | HTML estático cero-JS (excepto faq accordion island); SEO head | completada | 2026-10-15T02:15:00Z | @catalog |
| EJ-13 | Catálogo + ficha de vehículo | [locale]/vehicles/index.astro, [locale]/vehicles/[slug].astro (getStaticPaths), componentes vehicle/* (card, grid, specs, amenities, status-badge, floorplan), shared/seo-head.astro + json-ld.astro + src/lib/seo.ts | JSON-LD Product; hreflang; imágenes width/height explícitos (CLS); reseñas fuera de MVP | completada | 2026-10-15T02:18:00Z | @catalog |
| EJ-14 | Páginas FAQ y rutas | [locale]/faq.astro + landing/faq-section.tsx (island accordion); [locale]/routes/[slug].astro desde colección MDX bilingüe | FAQPage JSON-LD; rutas EN/FR con prefijos localizados | completada | 2026-10-15T02:20:00Z | @catalog |
| EJ-15 | Booking store + widget (TDD) | src/stores/booking-store.ts (§9.2), src/components/booking/: booking-widget.tsx, price-breakdown.tsx, extras-selector.tsx, booking-form.tsx; hooks use-price-calculator | Tests Testing Library (jsdom); usa calculatePrice pura; POST /api/reservations; nota "no payment" | completada | 2026-10-15T02:22:00Z | @interactivity |
| EJ-16 | Calendario de disponibilidad (TDD) | src/components/calendar/: availability-calendar.tsx (§10.2), day-cell.tsx, availability-legend.tsx, date-range-picker implícito; hook use-availability | Tests de lógica de rangos; a11y (aria-label, teclado, aria-live); fetch /api/availability; degradación 503→disponible | completada | 2026-10-15T02:24:00Z | @interactivity |
| EJ-17 | Filtros del catálogo | src/stores/filter-store.ts (§9.2), src/components/vehicle/vehicle-filters.tsx (island), hook use-vehicle-filters; fetch /api/vehicles.json | client:visible; estado vacío amigable; orden price/length/recommended | completada | 2026-10-15T02:18:00Z | @interactivity |
| EJ-18 | CI, deploy y SEO técnico | .github/workflows/ci.yml (§17.4), vercel.json (§17.2), robots.txt, sitemap vía @astrojs/sitemap i18n | Sin crons (Hobby); headers de caché; solo PUBLIC_ vars | completada | 2026-10-15T02:35:00Z | @foundation |
| EJ-19 | VERIFY: batería completa | npm run lint, type-check (astro check), test, build; checklist manual (secrets, N+1, a11y, presupuesto §19); reporte reports/qa/phase-1-report.md | Todo en verde exigido antes de DELIVER | completada | 2026-10-15T02:55:00Z | @qa-seo |
| EJ-20 | DELIVER: resumen y bitácora | Resumen de cambios, archivos, verificación, decisiones; registro en reports/decisions.md y bitácora de sesión | Incluir mappíng a secciones del SDD | pendiente | — | @tech-lead |
