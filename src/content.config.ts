// src/content.config.ts — SDD §4.1 (definición de colecciones)
// Los schemas Zod se importan desde src/lib/content-schemas.ts para
// reutilizarlos en los tests unitarios (decisión operativa).
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
// Imports relativos: el generador de tipos de Content Collections resuelve
// mejor los schemas así (data deja de ser `any` en CollectionEntry).
import {
  vehicleSchema,
  routeSchema,
  blogSchema,
  faqSchema,
} from "./lib/content-schemas";

// Nota ADR-019 (upgrade Astro 5): el generateId por defecto del glob loader
// slugifica los ids ("rocky-mountains.fr.mdx" → "rocky-mountainsfr"), lo que
// rompía routeSlug() y getStaticPaths. Fijamos generateId para conservar el
// id sin extensión (y sin subdirectorio), idéntico al comportamiento de Astro 4.
const keepFileNameId = ({ entry }: { entry: string }) =>
  entry.split("/").pop()!.replace(/\.(mdx|json)$/, "");

const vehicles = defineCollection({
  loader: glob({
    pattern: "vehicles/*.json",
    base: "./src/content",
    generateId: keepFileNameId,
  }),
  schema: vehicleSchema,
});

const routes = defineCollection({
  loader: glob({
    pattern: "routes/*.{en,fr}.mdx",
    base: "./src/content",
    generateId: keepFileNameId,
  }),
  schema: routeSchema,
});

const blog = defineCollection({
  loader: glob({
    pattern: "blog/*.{en,fr}.mdx",
    base: "./src/content",
    generateId: keepFileNameId,
  }),
  schema: blogSchema,
});

const faq = defineCollection({
  loader: glob({
    pattern: "faq/*.json",
    base: "./src/content",
    generateId: keepFileNameId,
  }),
  schema: faqSchema,
});

export const collections = { vehicles, routes, blog, faq };
