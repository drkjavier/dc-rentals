// src/lib/seo.ts — Helpers de metadata y JSON-LD (SDD §14)
import type { VehicleSummary } from "@/lib/content";
import { swapLocalePath, type Locale } from "@/lib/i18n";

function siteUrl(): string {
  return (import.meta.env.PUBLIC_SITE_URL as string | undefined) ?? "https://dc-rentals.ca";
}

/** URL absoluta de una ruta localizada */
export function absoluteUrl(locale: Locale, path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`.replace(`/${locale}`, `/${locale}`);
}

/** Canonical + alternates EN/FR de una página localizada */
export function localizeSeo(
  locale: Locale,
  pathname: string
): { canonical: string; alternates: Record<string, string> } {
  const canonical = `${siteUrl()}${pathname}`;
  const other = swapLocalePath(pathname);
  const alternates: Record<string, string> = { [locale]: canonical };
  if (other) alternates[locale === "en" ? "fr" : "en"] = `${siteUrl()}${other}`;
  return { canonical, alternates };
}

/** JSON-LD Product para la ficha de vehículo (SDD §14.2) */
export function vehicleJsonLd(vehicle: VehicleSummary, locale: Locale) {
  const prefix = locale === "fr" ? "/fr/vehicules" : "/en/vehicles";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: vehicle.name,
    description: locale === "fr" ? vehicle.descriptionFr : vehicle.description,
    image: `${siteUrl()}${vehicle.mainImage}`,
    brand: { "@type": "Brand", name: vehicle.brand },
    url: `${siteUrl()}${prefix}/${vehicle.slug}`,
    offers: {
      "@type": "Offer",
      price: vehicle.pricePerNightCAD,
      priceCurrency: "CAD",
      availability:
        vehicle.status === "AVAILABLE"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
      priceValidUntil: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    },
  };
}

/** JSON-LD WebSite para la landing */
export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DC Rentals",
    description:
      locale === "fr"
        ? "Location de camping-cars premium pour des road trips inoubliables au Canada"
        : "Premium RV rentals for unforgettable road trips across Canada",
    url: `${siteUrl()}/${locale}`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl()}/${locale === "fr" ? "vehicules" : "vehicles"}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/** JSON-LD FAQPage para la sección de preguntas frecuentes */
export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
