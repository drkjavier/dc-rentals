# reports/qa/phase-1-report.md — Auditoría Fase 1 (MVP Landing)

> **Fecha**: 2026-10-15
> **Alcance**: MVP completo (Fase 1+2 del roadmap, TECHNICAL-SPEC v2)
> **Veredicto**: ✅ **APROBADO** (con deuda documentada en `reports/decisions.md`)

## Batería de verificación

| Comando | Resultado |
|---|---|
| `npm run lint` (ESLint + astro + jsx-a11y) | ✅ 0 errores, 0 warnings |
| `npm run type-check` (`astro check`) | ✅ 0 errores (81 archivos) |
| `npm run test` (Vitest, unit + Testing Library) | ✅ 93/93 tests en 8 archivos |
| `npm run build` (`astro build`, valida Content Collections) | ✅ exit 0 — 23 páginas SSG + 4 serverless functions |
| `npx playwright test` (E2E smoke) | ✅ 5/5 (landing, catálogo, ficha, FR, 404) |

## Checklist manual (§5.2 checklist SDD + §18 a11y + §19 perf)

- [x] **Sin secrets en código**: solo referencias a env vars; `SUPABASE_SERVICE_ROLE_KEY` solo en `src/lib/supabase.ts` (server); ningún valor literal de claves.
- [x] **Cumple restricciones AGENTS.md**: Astro por defecto (islands solo donde hay estado); `PUBLIC_ENABLE_PAYMENTS=false` y cero dependencias Stripe; fechas como `YYYY-MM-DD` en lógica de disponibilidad; `price_snapshot` JSONB en el insert; RLS en las 3 tablas del schema; tests para `pricing.ts` y `availability.ts`.
- [x] **Sin N+1**: catálogo en Content Collections (1 lectura); endpoints hacen 1 query a Supabase por request; sin loops de queries.
- [x] **Presupuesto JS inicial (landing)**: 45.8 KB gzipped (react-dom island runtime + faq + language-switcher + mobile-nav) < 60 KB.
- [x] **CSS**: Tailwind purge < 30 KB (directivas @tailwind + purge por content globs).
- [x] **A11y**: skip link, `focus-visible` global, labels asociados en formularios, `aria-live` en carga del calendario y mensajes de error (`role="alert"`), `role="dialog"` + focus devolución en lightbox, `prefers-reduced-motion` respetado, contraste de la paleta §11.2 verificado (brand sobre blanco ≥ 4.5:1).
- [x] **i18n**: `/en` + `/fr` (+ prefijos localizados `/fr/vehicules`, `/fr/itineraires`), hreflang + canonical en todas las páginas, redirect raíz por Accept-Language.
- [x] **Feature flag de pagos**: UI muestra "Request Reservation / No payment required"; flujo PENDING + confirmación manual (§12.1); sin rastro de Stripe.

## Hallazgos corregidos durante la fase (P3)

1. `@astrojs/tailwind` incompatible con Astro 4.16 → PostCSS directo (ADR-012).
2. `@astrojs/sitemap@3.7` requiere Astro 5 → fijado a 3.1.6 (ADR-013).
3. Integración MDX no registrada en `astro.config.mjs` (colección routes vacía) → añadida.
4. Slugs de rutas con `.mdx` residual → `routeSlug()` corregido.
5. `availableFromDate` llega como string en runtime build → defensa con `new Date()`.

## Deuda conocida (no bloqueante)

- E2E contra `astro dev` (el adaptador Vercel no soporta `astro preview`); en CI puede levantarse el mismo smoke contra el preview de Vercel.
- Tipos de colecciones (`data: any` por limitación del typegen, ADR-015) — mitigado con casts tipados.
- Comparador de unidades y notificaciones de disponibilidad: flags/fases futuras según roadmap.
