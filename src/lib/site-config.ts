// src/lib/site-config.ts — Config central del sitio (branding editable)
// SDD: TECHNICAL-SPEC.md §6 — ADR-020 (panel admin). El JSON vive en
// src/config/site-config.json y se valida con Zod para garantizar que los
// cambios hechos desde /admin (que commitean el JSON) siempre sean válidos:
// si el config rompe el schema, el build de Vercel falla antes de publicar.
//
// El logo "icon" usa el catálogo ICONS de este módulo (paths SVG inline);
// el logo "image" apunta a un asset en /public (subido desde el admin).
import { z } from "astro/zod";
import siteConfigJson from "@/config/site-config.json";

interface IconDef {
  viewBox: string;
  /** Paths SVG (stroke currentColor, sin fill). Los círculos van como arcos. */
  paths: string[];
}

/** Catálogo de iconos SVG inline disponibles para el logo del header. */
export const ICONS: Record<"van" | "mountain" | "compass" | "map", IconDef> = {
  van: {
    viewBox: "0 0 24 24",
    paths: [
      "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
      "M9 17h6",
      "M7 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
      "M17 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
    ],
  },
  mountain: {
    viewBox: "0 0 24 24",
    paths: ["m8 3 4 8 5-5 5 15H2L8 3z"],
  },
  compass: {
    viewBox: "0 0 24 24",
    paths: [
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
      "m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12",
    ],
  },
  map: {
    viewBox: "0 0 24 24",
    paths: [
      "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z",
      "M15 5.764v15",
      "M9 3.236v15",
    ],
  },
};

export const logoIcon = z.enum(["van", "mountain", "compass", "map"]);

export const siteConfigSchema = z.object({
  brandName: z.string().min(1).max(60).default("DC Rentals"),
  logo: z
    .object({
      /** "icon" = catálogo ICONS; "image" = archivo subido a /public */
      type: z.enum(["icon", "image"]).default("icon"),
      icon: logoIcon.default("van"),
      /** Ruta a /public cuando type="image" (p. ej. /images/logo.png) */
      image: z.string().nullable().default(null),
      /** Color de fondo del badge del logo (hex) */
      backgroundColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un hex #RRGGBB")
        .default("#1E40AF"),
    })
    .default({ type: "icon", icon: "van", image: null, backgroundColor: "#1E40AF" }),
  hero: z
    .object({
      /** Ruta a /public de la imagen panorámica de fondo del hero */
      image: z.string().min(1).default("/images/hero/hero-rv.svg"),
      /** Opacidad de la imagen de fondo (0-100) */
      overlayOpacity: z.number().int().min(0).max(100).default(60),
    })
    .default({ image: "/images/hero/hero-rv.svg", overlayOpacity: 60 }),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;

/** Lee y valida el config central. Falla el build si el JSON es inválido. */
export function getSiteConfig(): SiteConfig {
  return siteConfigSchema.parse(siteConfigJson);
}
