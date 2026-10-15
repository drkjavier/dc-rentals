# TODO — Panel de administración (trucks, rutas, config visual)

**Fecha:** 2026-10-15
**Objetivo:** Admin web autenticado (/admin) que edita trucks, rutas, logo e imagen hero, commiteando a GitHub → Vercel redespliega a producción.

| ID | Nombre | Descripción | Consideraciones | Estado | Timestamp finalizada | Agente |
|----|--------|-------------|-----------------|--------|----------------------|--------|
| A1 | Config central del sitio | `src/config/site-config.json` + `src/lib/site-config.ts` (schema Zod + loader) | brandName, logo{type,icon,image,backgroundColor}, hero{image,overlayOpacity} | completada | 2026-10-15T09:53 | orchestrator |
| A2 | Consumir config en UI | header.astro (logo+nombre), hero-section.astro (imagen), footer.astro (nombre) | Catálogo ICONS inline (van/mountain/compass/map) | completada | 2026-10-15T09:55 | orchestrator |
| A3 | Lib admin: auth + GitHub client | auth.ts (timing-safe), github.ts (Contents API get/put/upload), guard.ts | GITHUB_TOKEN server-only; 1 MB límite; UTF-8 base64; 409-retry | completada | 2026-10-15T09:57 | orchestrator |
| A4 | Endpoints API admin | site-config (GET/PUT), vehicles (GET/POST + [code] GET/PUT/DELETE-405), routes (GET + [slug] GET/PUT), upload (POST) | Zod antes de commitear; 401/503/400 | completada | 2026-10-15T10:00 | orchestrator |
| A5 | UI admin | `/admin` (Astro noindex) + island React con pestañas Config/Trucks/Rutas | Token en sessionStorage; js-yaml para frontmatter MDX | completada | 2026-10-15T10:04 | orchestrator |
| A6 | Tests unitarios | admin-site-config (9), admin-auth (7), admin-route-mdx (8) | Happy+sad path del .feature | completada | 2026-10-15T10:08 | orchestrator |
| A7 | Verificación final | build OK (nodejs22.x), 117 tests, 0 lint, 0 type errors | /admin prerender estático + 6 APIs serverless | completada | 2026-10-15T10:08 | orchestrator |
| A8 | Docs | ADR-020 + docs/admin-panel.md (env vars para Vercel) | ADMIN_TOKEN, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH | completada | 2026-10-15T10:11 | orchestrator |
