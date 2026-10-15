// astro.config.mjs
// SDD: TECHNICAL-SPEC.md §1.2 — modo híbrido (SSG + server endpoints), i18n, sitemap.
// Nota operativa (ADR-012 en reports/decisions.md): Tailwind se conecta vía
// PostCSS directo (postcss.config.mjs) porque @astrojs/tailwind@0.2.x rompe
// con Astro 4.16 (config.style.postcss eliminado). Mismo resultado y tokens.
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  site: "https://dc-rentals.ca",
  output: "hybrid", // SSG por defecto + server endpoints (prerender = false)
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
