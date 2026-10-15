// src/lib/i18n.ts
// SDD: TECHNICAL-SPEC.md §7.1 — helper i18n ligero (ADR-004).
export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeConfig: Record<
  Locale,
  {
    name: string;
    flag: string;
    htmlLang: string;
    ogLocale: string;
  }
> = {
  en: { name: "English", flag: "🇨🇦", htmlLang: "en-CA", ogLocale: "en_CA" },
  fr: { name: "Français", flag: "🇨🇦", htmlLang: "fr-CA", ogLocale: "fr_CA" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Traducciones para componentes (nav, UI). El contenido usa Content Collections. */
import en from "../../public/locales/en/common.json";
import fr from "../../public/locales/fr/common.json";

const messages = { en, fr } as const;

export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const parts = key.split(".");
  let value: unknown = messages[locale];
  for (const part of parts) {
    value = (value as Record<string, unknown>)?.[part];
  }
  if (typeof value !== "string") return key;
  return vars
    ? value.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
    : value;
}

/** Rutas localizadas: /fr usa "vehicules" e "itineraires" en español→francés */
export function localizedPath(locale: Locale, path: string): string {
  const frPaths: Record<string, string> = {
    vehicles: "vehicules",
    routes: "itineraires",
  };
  const translated =
    locale === "fr"
      ? path.replace(/^\/(vehicles|routes)(?=\/|$)/, (_m, segment: string) => {
          return `/${frPaths[segment] ?? segment}`;
        })
      : path;
  return `/${locale}${translated}`;
}

/** Invierte la localización: detecta el locale a partir de la ruta (/fr/vehicules/... → fr) */
export function localeFromPath(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return isLocale(segment) ? segment : null;
}

/** Ruta canónica de la landing en un locale dado */
export function homePath(locale: Locale): string {
  return `/${locale}`;
}

export function alternateLocale(locale: Locale): Locale {
  return locale === "en" ? "fr" : "en";
}

const FR_SEGMENTS: Record<string, string> = {
  vehicles: "vehicules",
  routes: "itineraires",
};
const EN_SEGMENTS: Record<string, string> = Object.fromEntries(
  Object.entries(FR_SEGMENTS).map(([en, fr]) => [fr, en])
);

/**
 * Devuelve la misma ruta en el idioma opuesto, traduciendo los segmentos
 * localizados (vehicles↔vehicules, routes↔itineraires).
 * Ej: /en/vehicles/x → /fr/vehicules/x ; /fr/faq → /en/faq
 */
export function swapLocalePath(pathname: string): string | null {
  const match = pathname.match(/^\/(en|fr)(\/.*)?$/);
  if (!match) return null;
  const current = match[1] as Locale;
  const rest = match[2] ?? "/";
  const target = alternateLocale(current);
  const segments = rest.split("/");
  const seg = segments[1];
  if (target === "fr" && FR_SEGMENTS[seg]) segments[1] = FR_SEGMENTS[seg];
  if (target === "en" && EN_SEGMENTS[seg]) segments[1] = EN_SEGMENTS[seg];
  const joined = segments.join("/");
  return joined === "/" ? `/${target}` : `/${target}${joined}`;
}
