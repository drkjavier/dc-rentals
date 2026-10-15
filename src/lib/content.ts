// src/lib/content.ts — Helpers tipados para leer Content Collections
// SDD: TECHNICAL-SPEC.md §4.1 y ficha de @catalog (AGENT-TEAM-SPEC §3.4)
import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "@/lib/i18n";
import { LOCATIONS, getLocationById } from "@/lib/locations";
import { TYPE_LABELS } from "@/lib/vehicle-labels";
import type { VehicleData } from "@/lib/content-schemas";

export type VehicleEntry = CollectionEntry<"vehicles">;
export type RouteEntry = CollectionEntry<"routes">;
export type FaqEntry = CollectionEntry<"faq">;

/** Shape que consume la UI (cards, ficha) y el endpoint /api/vehicles.json */
export interface VehicleSummary {
  internalCode: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleData["type"];
  typeLabel: string;
  status: VehicleData["status"];
  description: string;
  descriptionFr: string;
  sleepCapacity: number;
  seatBelts: number;
  petFriendly: boolean;
  pricePerNightCAD: number;
  securityDepositCAD: number;
  locationId: string;
  locationName: string;
  mainImage: string;
  floorPlanSvg?: string;
  lengthDisplay: string;
  specs: VehicleData["specs"];
  amenities: VehicleData["amenities"];
  images: VehicleData["images"];
  availableFromDate?: Date;
  featured: boolean;
  active: boolean;
}

export function toVehicleSummary(entry: VehicleEntry, locale: Locale = "en"): VehicleSummary {
  const v = entry.data;
  const location = getLocationById(v.locationId);
  return {
    internalCode: v.internalCode,
    slug: v.slug,
    name: v.name,
    brand: v.brand,
    model: v.model,
    year: v.year,
    type: v.type,
    typeLabel: TYPE_LABELS[locale][v.type],
    status: v.status,
    description: v.description,
    descriptionFr: v.descriptionFr,
    sleepCapacity: v.sleepCapacity,
    seatBelts: v.seatBelts,
    petFriendly: v.petFriendly,
    pricePerNightCAD: v.pricePerNightCAD,
    securityDepositCAD: v.securityDepositCAD,
    locationId: v.locationId,
    locationName: location?.city ?? v.locationId,
    mainImage: v.mainImage,
    floorPlanSvg: v.floorPlanSvg,
    lengthDisplay: `${v.specs.lengthFt} (${v.specs.lengthM} m)`,
    specs: v.specs,
    amenities: v.amenities,
    images: v.images,
    availableFromDate: v.availableFromDate,
    featured: v.featured,
    active: v.active,
  };
}

/** Catálogo completo (activos) como VehicleSummary — para /api/vehicles.json */
export async function getVehiclesForApi(locale: Locale = "en"): Promise<VehicleSummary[]> {
  const vehicles = await getCollection("vehicles", ({ data }) => data.active);
  return vehicles
    .map((entry) => toVehicleSummary(entry, locale))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
}

export async function getVehicleBySlug(
  slug: string,
  _locale: Locale = "en"
): Promise<VehicleSummary | null> {
  const vehicles = await getCollection("vehicles", ({ data }) => data.active);
  const entry = vehicles.find((v) => v.data.slug === slug);
  return entry ? toVehicleSummary(entry, _locale) : null;
}

export async function getVehicleByCode(
  internalCode: string
): Promise<VehicleSummary | null> {
  const vehicles = await getCollection("vehicles");
  const entry = vehicles.find((v) => v.data.internalCode === internalCode);
  return entry ? toVehicleSummary(entry, "en") : null;
}

export async function getFeaturedVehicles(locale: Locale = "en"): Promise<VehicleSummary[]> {
  const vehicles = await getCollection(
    "vehicles",
    ({ data }) => data.active && data.featured
  );
  return vehicles.map((entry) => toVehicleSummary(entry, locale));
}

export async function getSimilarVehicles(
  vehicle: VehicleSummary,
  limit = 3
): Promise<VehicleSummary[]> {
  const vehicles = await getCollection(
    "vehicles",
    ({ data }) => data.active && data.slug !== vehicle.slug
  );
  const sameType = vehicles.filter((v) => v.data.type === vehicle.type);
  const others = vehicles.filter((v) => v.data.type !== vehicle.type);
  return [...sameType, ...others]
    .slice(0, limit)
    .map((entry) => toVehicleSummary(entry, "en"));
}

/** Rutas de un locale (slug sin sufijo .en/.fr) */
export interface RouteSummary {
  slug: string;
  name: string;
  description: string;
  distance: string;
  duration: string;
  difficulty: "easy" | "moderate" | "challenging";
  bestSeason: string;
  image: string;
  highlights: string[];
  stops: Array<{ name: string; lat: number; lng: number; description?: string }>;
}

function routeSlug(id: string): string {
  return id.replace(/\.(en|fr)$/, "");
}

export async function getRoutes(locale: Locale): Promise<RouteSummary[]> {
  const routes = await getCollection(
    "routes",
    ({ data }) => data.active && data.locale === locale
  );
  return routes
    .map((r) => ({
      slug: routeSlug(r.id),
      name: r.data.name,
      description: r.data.description,
      distance: r.data.distance,
      duration: r.data.duration,
      difficulty: r.data.difficulty,
      bestSeason: r.data.bestSeason,
      image: r.data.image,
      highlights: r.data.highlights,
      stops: r.data.stops,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRouteBySlug(
  slug: string,
  locale: Locale
): Promise<RouteSummary | null> {
  const routes = await getRoutes(locale);
  return routes.find((r) => r.slug === slug) ?? null;
}

/** FAQ de un locale, agrupada por categoría y ordenada */
export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export async function getFaq(locale: Locale): Promise<FaqItem[]> {
  const faq = await getCollection(
    "faq",
    ({ data }) => data.locale === locale
  );
  return faq
    .map((f) => ({
      id: f.data.id,
      category: f.data.category,
      question: f.data.question,
      answer: f.data.answer,
      sortOrder: f.data.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export { LOCATIONS };
