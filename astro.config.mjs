// astro.config.mjs
// SDD: TECHNICAL-SPEC.md §1.2 — modo híbrido (SSG + server endpoints), i18n, sitemap.
// Nota operativa (ADR-012 en reports/decisions.md): Tailwind se conecta vía
// PostCSS directo (postcss.config.mjs) porque @astrojs/tailwind@0.2.x rompe
// con Astro 4.16 (config.style.postcss eliminado). Mismo resultado y tokens.
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
// Nota ADR-019 (upgrade Astro 5 + @astrojs/vercel@9): en v9 el adaptador
// serverless se importa desde "@astrojs/vercel" (el subpath /serverless está
// deprecado). El adaptador emite runtime nodejs22.x — aceptado por Vercel.
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://dc-rentals.ca",
  // Nota ADR-019 (upgrade Astro 5): `output: "hybrid"` fue eliminado — su
  // comportamiento es ahora el default `'static'`. Las rutas con
  // `export const prerender = false` (endpoints API) siguen serverless igual.
  adapter: vercel(),
  integrations: [
    react(), // Islands interactivos (React)
    mdx(), // Content Collections MDX (routes, blog)
    // Nota operativa (ADR-012): sin opción i18n en sitemap — @astrojs/sitemap@3.7
    // crashea con `routes` undefined en Astro 4.16 híbrido; los hreflang ya se
    // emiten por página (seo-head.astro).
    sitemap(),
  ],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
    routing: {
      prefixDefaultLocale: false, // /en/... y /fr/... (raíz redirige)
    },
  },
  image: {
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
