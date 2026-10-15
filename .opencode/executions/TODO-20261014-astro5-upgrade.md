# TODO — Upgrade Astro 4.16 → 5.x + @astrojs/vercel 7 → 9

**Fecha:** 2026-10-14
**Motivo:** Vercel rechaza `nodejs18.x` (runtime emitido por @astrojs/vercel@7 con Node 24). Solo `@astrojs/vercel@9` emite `nodejs22.x` válido, y requiere Astro 5.

| ID | Nombre | Descripción | Consideraciones | Estado | Timestamp finalizada | Agente |
|----|--------|-------------|-----------------|--------|----------------------|--------|
| T1 | Upgrade dependencias core | `astro@^5.18.2`, `@astrojs/vercel@^9.0.5`, `@astrojs/mdx@^4.3.14`, `@astrojs/react@^4.4.2` + `engines.node: 22.x` | Peer deps ok; npm install limpio | completada | 2026-10-14T23:40 | orchestrator |
| T2 | Quitar output hybrid | Eliminar `output: "hybrid"` de astro.config.mjs + import desde "@astrojs/vercel" | Híbrido fusionado con 'static'; prerender=false intacto | completada | 2026-10-14T23:42 | orchestrator |
| T3 | Fix Content Collections Astro 5 | Dividir faq.json (array) en 18 archivos; generateId en loaders glob; routeSlug() exportada y tolerante | El glob loader de Astro 5 slugificaba ids ("rocky-mountainsfr") | completada | 2026-10-14T23:47 | orchestrator |
| T4 | Verificar build | `npm run build` OK; `.vc-config.json` → `"runtime": "nodejs22.x"` | Verificado explícitamente | completada | 2026-10-14T23:49 | orchestrator |
| T5 | Verificar tests + lint + type-check | 93 tests OK; eslint limpio; astro check 0 errores | Test de faq adaptado a archivos individuales | completada | 2026-10-14T23:49 | orchestrator |
| T6 | Documentar ADR-019 | reports/decisions.md — upgrade Astro 5 por runtime Vercel | ADR-013 ya existía (sitemap) | completada | 2026-10-14T23:50 | orchestrator |
