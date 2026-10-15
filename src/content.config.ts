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

const vehicles = defineCollection({
  loader: glob({ pattern: "vehicles/*.json", base: "./src/content" }),
  schema: vehicleSchema,
});

const routes = defineCollection({
  loader: glob({ pattern: "routes/*.{en,fr}.mdx", base: "./src/content" }),
  schema: routeSchema,
});

const blog = defineCollection({
  loader: glob({ pattern: "blog/*.{en,fr}.mdx", base: "./src/content" }),
  schema: blogSchema,
});

const faq = defineCollection({
  loader: glob({ pattern: "faq/*.json", base: "./src/content" }),
  schema: faqSchema,
});

export const collections = { vehicles, routes, blog, faq };
