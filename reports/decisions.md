# reports/decisions.md — Bitácora de decisiones (ADRs operativos)

> Registro de decisiones del equipo de agentes. Las ADR-001..011 viven en
> `TECHNICAL-SPEC.md` §20 (SDD). Aquí se registran las decisiones operativas
> tomadas durante la ejecución.

## ADR-012: Tailwind vía PostCSS directo (no @astrojs/tailwind)

- **Fecha**: 2026-10-15
- **Decisión**: Conectar Tailwind con `postcss.config.mjs` (`tailwindcss` + `autoprefixer`) en lugar de la integración `@astrojs/tailwind`.
- **Contexto**: `@astrojs/tailwind@0.2.5` (única versión publicada) crashea con Astro 4.16 (`Cannot read properties of undefined (reading 'postcss')`) porque Astro 4.16 eliminó `config.style.postcss` de la config resuelta.
- **Impacto**: Ninguno en resultado visual ni configuración: `tailwind.config.mjs`, tokens §6 y `globals.css` (directivas `@tailwind`) son idénticos. `applyBaseStyles:false` se logra importando `globals.css` en `layout.astro`.

## ADR-013: @astrojs/sitemap fijado a 3.1.x

- **Fecha**: 2026-10-15
- **Decisión**: Fijar `@astrojs/sitemap@3.1.6` y omitir la option `i18n` del sitemap.
- **Contexto**: `@astrojs/sitemap@3.7` depende del hook `astro:routes:resolved` (Astro 5); con Astro 4.16 `_routes` queda undefined y el build falla en `astro:build:done`. Además el branch i18n de 3.7 rompe con `routes` undefined en modo híbrido.
- **Mitigación SEO**: los tags `hreflang`/`alternate` se emiten por página con `seo-head.astro` (§14.1), por lo que la cobertura de idiomas del sitemap no es crítica.

## ADR-014: Degradación graceful sin Supabase (acordada con el Orquestador)

- **Fecha**: 2026-10-15
- **Decisión**: Sin `PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, el endpoint de disponibilidad responde con todos los días `available`, `availability-check` responde `available: true` y `POST /api/reservations` responde **503 `DATABASE_NOT_CONFIGURED`** con mensaje claro. El calendario no se rompe y la reserva no falla en silencio.
- **Razón**: no hay proyecto Supabase real en este entorno; el código (schema, RLS, clientes, endpoints) queda listo para conectar cuando existan las claves.

## ADR-015: Schemas Zod en `src/lib/content-schemas.ts`

- **Fecha**: 2026-10-15
- **Decisión**: Los schemas de Content Collections viven en `src/lib/content-schemas.ts` (importados por `content.config.ts`) para poder testearlos con Vitest sin resolver `astro:content`. Se usa `astro/zod` (misma API que `zod`).
- **Limitación conocida**: el typegen de Astro 4.16 escribe `data: any` y `ContentConfig = never` cuando los schemas vienen de otro módulo; los datos SÍ se validan con Zod en build/dev (build falla con datos inválidos). `content.ts` aplica casts tipados explícitos (`as unknown as VehicleData`) — sin pérdida de validación runtime.

## ADR-016: Filtros del catálogo sobre el DOM SSR (sin fetch a /api/vehicles.json)

- **Fecha**: 2026-10-15
- **Decisión**: El island `vehicle-filters` filtra/ordena las tarjetas SSR del catálogo mediante `data-*` attributes (hide + `style.order`) en vez de fetchear `/api/vehicles.json` y re-renderizar.
- **Razón**: mantiene el catálogo 100% indexable y visible sin JS (mejor SEO/CLS que el enfoque fetch del §9.1), con la misma UX. El endpoint `GET /api/vehicles.json` se implementa igual (contrato §8.1) para consumidores futuros.

## ADR-017: Reviews fuera del MVP

- **Fecha**: 2026-10-15
- **Decisión**: La sección de reseñas (`ReviewList`) no se implementa en esta fase; `TECHNICAL-SPEC.md` §2.1 difiere las reseñas a "Fase futura (Supabase)". La ficha no renderiza ratings inventados.
- **Verificado en**: `TECHNICAL-SPEC.md` §2.1 (estrategia de datos) — Reseñas = Fase futura.

## ADR-018: Placeholders SVG y fotos reales

- **Fecha**: 2026-10-15
- **Decisión**: Todas las imágenes del MVP son placeholders SVG generados por `scripts/generate-placeholders.mjs` (convención §13.2, sufijo `.svg`). Las fotos reales se sustituyen en `public/images/` sin tocar código (mismas rutas).

## ADR-019: Upgrade Astro 4.16 → 5.18 + @astrojs/vercel 7 → 9 (runtime Vercel)

- **Fecha**: 2026-10-14
- **Decisión**: Migrar a `astro@^5.18.2` y `@astrojs/vercel@^9.0.5` (también `@astrojs/mdx@^4`, `@astrojs/react@^4`).
- **Contexto**: Vercel eliminó `nodejs18.x` (2025-09) y `nodejs20.x` (2026-10-01) como runtimes válidos para despliegues nuevos. `@astrojs/vercel@7.x` solo conoce Node 18/20 y emitía `"runtime": "nodejs18.x"` en `.vc-config.json`, causando `The following Serverless Functions contain an invalid "runtime"`. Solo `@astrojs/vercel@9.x` emite `nodejs22.x`, y requiere Astro 5.
- **Cambios derivados**:
  - `output: "hybrid"` eliminado de `astro.config.mjs` (fusionado con `'static'` en Astro 5; `prerender = false` sigue funcionando).
  - Import del adaptador: `@astrojs/vercel` (el subpath `/serverless` está deprecado).
  - `src/content/faq/faq.json` (array) dividido en `faq/<id>.<locale>.json` (el glob loader de Astro 5 espera un objeto por archivo).
  - `generateId` fijado en los loaders glob para conservar ids estilo Astro 4 (`rocky-mountains.fr`), ya que el default slugificaba (`rocky-mountainsfr`).
  - `routeSlug()` exportada y tolerante al id sin extensión.
- **Verificación**: build OK con `.vc-config.json` → `"runtime": "nodejs22.x"`; 93 tests unitarios OK; `astro check` 0 errores; eslint limpio.

## ADR-020: Panel de administración de contenido (trucks, rutas, branding)

- **Fecha**: 2026-10-15
- **Decisión**: Panel web autenticado en `/admin` (Astro server + island React) que edita trucks (Content Collections JSON), rutas (MDX con frontmatter) y config visual central (`src/config/site-config.json`: brandName, logo, imagen hero). Los cambios se publican **commiteando directo a la rama main** del repo desplegado mediante la GitHub Contents API; Vercel detecta el push y redespliega a producción (~30 s).
- **Razón**: el sitio es SSG — no hay base de datos de contenido que editar en runtime. En lugar de migrar trucks/rutas a Supabase (contravierte ADR-003 y sería una migración mayor), el panel usa GitHub como backend de almacenamiento, manteniendo Content Collections como fuente de verdad.
- **Seguridad**:
  - Auth por token compartido `ADMIN_TOKEN` (env var), comparado con `crypto.timingSafeEqual` (timing-safe). Token solo en `sessionStorage` del browser.
  - `GITHUB_TOKEN`/`GITHUB_REPO`/`GITHUB_BRANCH` son env vars **server-only** (nunca `PUBLIC_*`); el browser solo ve los endpoints `/api/admin/*`.
  - Todos los endpoints validan con Zod **antes** de commitear (400 + sin commit si falla).
  - Subida de imágenes limitada a 1 MB (límite Contents API) y con allowlist de extensiones; path saneado contra traversal.
  - Página `/admin` con `noindex,nofollow`.
- **Endpooints**: `GET/PUT /api/admin/site-config`, `GET/POST /api/admin/vehicles`, `GET/PUT/DELETE(405) /api/admin/vehicles/[code]`, `GET /api/admin/routes`, `GET/PUT /api/admin/routes/[slug]`, `POST /api/admin/upload`.
- **Config central**: `src/lib/site-config.ts` (schema Zod + `getSiteConfig()`); header/footer/hero ahora lo consumen en vez de valores hardcoded. El logo usa un catálogo de iconos SVG inline (van/mountain/compass/map) o una imagen subida.
- **Borrado físico de trucks no soportado a propósito**: se ocultan con `active=false` para no romper enlaces ni perder historial.
- **Known limitations**: sin rate limiting ni 2FA (mitigable con un proxy/Cloudflare Access); sin upload de imágenes >1 MB; el commit va directo a main (no usa PRs).
- **Verificación**: build OK (`nodejs22.x`), 117 tests OK, `astro check` 0 errores, eslint limpio.

## ADR-021: Schema de Supabase como migraciones versionadas (Supabase CLI)

- **Fecha**: 2026-10-15
- **Decisión**: El schema de Supabase vive en `supabase/migrations/*.sql` (fuente única de verdad) y se aplica con la **Supabase CLI** (`npm run db:push`). Se eliminan los `supabase/schema.sql` y `supabase/seed.sql` sueltos, que pasan a ser migraciones `20261015000001_init_schema.sql` y `20261015000002_seed_demo.sql`.
- **Razón**: antes el schema era un `.sql` suelto que había que copiar/pegar manualmente en el SQL Editor (frágil, sin historial, dos posibles fuentes en conflicto). Con migraciones versionadas el cambio de schema es reproducible, auditable y de un solo comando. Consistente con AGENTS.md ("solo migraciones additive"): las migraciones son append-only, no se editan tras aplicarse.
- **Herramienta**: `supabase` CLI como devDependency (`^2.121.0`), no global. Scripts npm: `db:login`, `db:link` (project ref `towodmbmszrsbirsjzdj`), `db:push`, `db:push:direct` (conexión directa vía driver `pg`, ADR-021), `db:reset` (solo local), `db:status`.
- **Config**: `supabase/config.toml` (project_id `dc-rentals`).
- **Bug corregido**: el schema original usaba `create type if not exists ... as enum`, **no válido en PostgreSQL** (CREATE TYPE no acepta IF NOT EXISTS); se reemplaza por el patrón idempotente `DO + exception duplicate_object`. Ese schema habría fallado incluso en el SQL Editor.
- **Verificado**: schema aplicado a la BD hosted (7 tablas), calendario leyendo `availability_blocks` en vivo.
