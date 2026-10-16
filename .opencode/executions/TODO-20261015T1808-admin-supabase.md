# TODO — Migración del panel /admin de GitHub a Supabase (ADR-022)

> Ciclo GGVR — fase DEVELOP. Spec: `docs/gherkin/admin-panel-supabase.feature`
> Contrato de schema (fuente única de verdad para todos los agentes):
>
> ```sql
> vehicles_catalog(internal_code text PK, data jsonb, active bool, featured bool, updated_at timestamptz)
> routes_catalog(slug text, locale text 'en'|'fr', frontmatter jsonb, body text, active bool, updated_at timestamptz, PK(slug, locale))
> site_config(id bool PK default true, config jsonb, updated_at timestamptz)
> ```
>
> Reglas de contrato:
> - RLS: SELECT anónimo público en las 3 tablas; SIN policy de escritura (solo service role).
> - Bucket Storage `admin-images` (público lectura); objetos en `admin/<AAAA-MM>/<nombre>`.
> - Endpoints: mismas rutas/verbos que ADR-020. Respuestas: sustituir `commitSha` por
>   `deploy: "triggered" | "skipped"`. Upload responde `{ ok, url }` (URL pública de Storage).
> - `guard.ts`: solo auth (ADMIN_TOKEN). Los endpoints responden `503 DATABASE_NOT_CONFIGURED`
>   si falta Supabase (consistente con ADR-014).
> - `content.ts` (build): si Supabase configurado → catálogo desde DB; si no → fallback a
>   archivos seed del repo. FAQ siempre desde Content Collections.
> - Tras cada upsert exitoso: POST a `VERCEL_DEPLOY_HOOK` (opcional; sin ella → `deploy=skipped`).
> - `src/lib/admin/github.ts` se ELIMINA al final.

| ID  | Nombre | Descripción | Consideraciones | Estado | Timestamp finalizada | Agente |
|-----|--------|-------------|-----------------|--------|----------------------|--------|
| T1 | Migración SQL catálogo + Storage | `supabase/migrations/20261015000003_admin_catalog.sql`: tablas vehicles_catalog, routes_catalog, site_config + RLS (SELECT público, escritura solo service role) + bucket admin-images público | Additive (ADR-021); no tocar migraciones existentes; snake_case | completada | 2026-10-15T18:25 | data-ops |
| T2 | Script seed de catálogo | `scripts/seed-catalog.ts`: lee archivos seed (src/content/vehicles/*.json, routes/*.mdx, src/config/site-config.json) y hace upsert en las 3 tablas; script npm `seed:catalog` | Reusar schemas Zod de content-schemas.ts; frontmatter de rutas parseado sin astro:content; skip si no hay env vars con mensaje claro | completada | 2026-10-15T18:25 | data-ops |
| T3 | Lib catalog-db (CRUD Supabase) | `src/lib/admin/catalog-db.ts`: upsertVehicle/getVehicles, upsertRoute/getRoutes, getSiteConfig/putSiteConfig sobre las tablas; mapping row ↔ JSON validado con Zod | Server-only via getSupabaseServer(); null si no configurado; tratar empty DB como fallback | completada | 2026-10-15T18:30 | business-logic |
| T4 | Lib deploy hook | `src/lib/admin/deploy.ts`: triggerDeployHook() → POST VERCEL_DEPLOY_HOOK; retorna {triggered:boolean}; timeout corto y no lanza excepción | Env var VERCEL_DEPLOY_HOOK (server-only, sin PUBLIC_) | completada | 2026-10-15T18:30 | business-logic |
| T5 | Guard sin GitHub | `src/lib/admin/guard.ts`: requireAdmin solo valida ADMIN_TOKEN (quitar getGithubConfig); auth errors igual que hoy | No romper verifyAdminToken/isAuthConfigured | completada | 2026-10-15T18:30 | business-logic |
| T6 | Endpoints vehicles | `vehicles.ts` y `vehicles/[code].ts`: GET lista desde DB; POST/PUT validan con vehicleSchema y upsert; 409 si existe en POST; deploy hook tras guardar | Mantener shape de respuesta de la UI salvo deploy en vez de commitSha | completada | 2026-10-15T18:30 | business-logic |
| T7 | Endpoints routes | `routes.ts` y `routes/[slug].ts`: GET/PUT sobre routes_catalog (EN/FR), frontmatter validado + body markdown | Validación Zod antes de escribir; sin deploy si validación falla | completada | 2026-10-15T18:30 | business-logic |
| T8 | Endpoint site-config | `site-config.ts`: GET/PUT sobre tabla site_config (singleton id=true) | siteConfigSchema ya existe; 503 DATABASE_NOT_CONFIGURED si falta Supabase | completada | 2026-10-15T18:30 | business-logic |
| T9 | Endpoint upload a Storage | `upload.ts`: sube a bucket admin-images (admin/<AAAA-MM>/<nombre>), 1 MB, allowlist extensiones; responde { ok, url } | path saneado contra traversal; mime por extensión | completada | 2026-10-15T18:30 | business-logic |
| T10 | content.ts fuente de catálogo | Si Supabase configurado: getVehicles*/getRoutes* leen de DB (parse con schemas Zod) con memoización por build; fallback a getCollection si DB no configurada o vacía | FAQ intacta; no romper typegen; casts tipados como ADR-015 | completada | 2026-10-15T18:30 | business-logic |
| T11 | Eliminar github.ts | Borrar `src/lib/admin/github.ts` y todo import/uso residual (grep GITHUB_ debe dar 0 en src/) | Última tarea de backend; después de T6-T9 | completada | 2026-10-15T18:30 | business-logic |
| T12 | Tests unitarios backend | `tests/unit/catalog-db.test.ts` y `tests/unit/deploy.test.ts` (mock del cliente Supabase y fetch); mantener 117 tests existentes en verde | Vitest; sin tocar pricing/availability | completada | 2026-10-15T18:30 | business-logic |
| T13 | UI panel: mensajes de deploy | `src/components/admin/*.tsx`: mostrar estado del deploy (triggered/skipped/advertencia sin VERCEL_DEPLOY_HOOK); upload usa respuesta `url` | Sin cambiar layout/UX más allá del estado; mantener Tailwind tokens | completada | 2026-10-15T18:37 | web-dev |
| T14 | Docs panel + guía Vercel | `docs/admin-panel.md`: reemplazar guía de GitHub por Supabase + Deploy Hook (vars: ADMIN_TOKEN, Supabase, VERCEL_DEPLOY_HOOK); quitar creación de PAT | Incluir nota de cómo obtener el Deploy Hook (Vercel → Settings → Git → Deploy Hooks) | completada | 2026-10-15T18:37 | web-dev |
| T15 | VERIFY global | lint + type-check + tests unitarios + astro build; checklist: sin secrets en código, sin N+1, sin referencias GITHUB_ en src/, RLS en tablas nuevas | Orquestador verifica y reintegra tarea si falla | completada | 2026-10-15T18:40 | orchestrator |
