// astro.config.mjs
// SDD: TECHNICAL-SPEC.md §1.2 — modo híbrido (SSG + server endpoints), i18n, sitemap.
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  site: "https://dc-rentals.ca",
  output: "hybrid", // SSG por defecto + server endpoints (prerender = false)
  adapter: vercel(),
  integrations: [
    react(), // Islands interactivos (React)
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
