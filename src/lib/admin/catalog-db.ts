// src/lib/admin/catalog-db.ts — CRUD del catálogo del panel sobre Supabase
// ADR-022: el panel /admin deja de escribir en GitHub y pasa a escribir en
// 3 tablas con RLS de solo-escritura service role:
//   vehicles_catalog(internal_code PK, data jsonb, active, featured, updated_at)
//   routes_catalog(slug, locale PK, frontmatter jsonb, body, active, updated_at)
//   site_config(id bool PK, config jsonb, updated_at)  — singleton
//
// Reglas absolutas:
// - Validación Zod SIEMPRE antes de cualquier escritura (sin side effects).
// - active/featured viven también como columnas consultables (el jsonb `data`
//   es la fuente de verdad del objeto, pero el filtro por columnas es rápido).
// - Degradación graceful (ADR-014): si Supabase no está configurado,
//   las lecturas devuelven null y las escrituras false — nunca lanzan.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase";
import { vehicleSchema, routeSchema } from "@/lib/content-schemas";
import type { VehicleData } from "@/lib/content-schemas";
import { siteConfigSchema, type SiteConfig } from "@/lib/site-config";
import type { Locale } from "@/lib/i18n";
import { z } from "astro/zod";

// ─── Tipos del dominio del catálogo ───────────────────────

/** Frontmatter de una ruta: routeSchema sin locale ni active (son columnas). */
export const routeFrontmatterSchema = routeSchema.omit({ locale: true, active: true });
export type RouteFrontmatter = z.infer<typeof routeFrontmatterSchema>;

/** Fila completa de routes_catalog reconstruida a shape del panel (routeSchema). */
export interface RouteRecord {
  slug: string;
  data: z.infer<typeof routeSchema>;
  body: string;
}

// ─── Helpers internos ─────────────────────────────────────

function server(): SupabaseClient | null {
  return isSupabaseConfigured() ? getSupabaseServer() : null;
}

/** Extrae active/featured del objeto parseado a columnas + jsonb completo. */
function vehicleRow(parsed: VehicleData) {
  return {
    internal_code: parsed.internalCode,
    data: parsed,
    active: parsed.active,
    featured: parsed.featured,
    updated_at: new Date().toISOString(),
  };
}

/** Combina frontmatter (jsonb) + columnas locale/active → data routeSchema. */
function routeData(
  frontmatter: unknown,
  locale: Locale,
  active: boolean
): z.infer<typeof routeSchema> | null {
  const parsed = routeSchema.safeParse({ ...((frontmatter as object) ?? {}), locale, active });
  return parsed.success ? parsed.data : null;
}

// ─── vehicles_catalog ─────────────────────────────────────

/** Todas las filas del catálogo de trucks (incluye inactivos) para el panel. */
export async function listVehicles(): Promise<VehicleData[] | null> {
  const db = server();
  if (!db) return null;
  const { data, error } = await db
    .from("vehicles_catalog")
    .select("data, active, featured")
    .order("updated_at", { ascending: false });
  if (error || !Array.isArray(data)) return null;
  const vehicles: VehicleData[] = [];
  for (const row of data as Array<{ data: unknown; active: boolean; featured: boolean }>) {
    const parsed = vehicleSchema.safeParse(row.data);
    if (!parsed.success) continue; // fila corrupta: se omite sin romper el listado
    // Las columnas active/featured son la verdad consultable del panel
    vehicles.push({ ...parsed.data, active: row.active, featured: row.featured });
  }
  return vehicles;
}

/** Truck por código (insensible a mayúsculas; el schema exige mayúsculas). */
export async function getVehicleByCode(
  internalCode: string
): Promise<VehicleData | null> {
  const db = server();
  if (!db) return null;
  const { data, error } = await db
    .from("vehicles_catalog")
    .select("data, active, featured")
    .eq("internal_code", internalCode.toUpperCase())
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { data: unknown; active: boolean; featured: boolean };
  const parsed = vehicleSchema.safeParse(row.data);
  if (!parsed.success) return null;
  return { ...parsed.data, active: row.active, featured: row.featured };
}

/**
 * Upsert de un truck. El input se parsea con vehicleSchema ANTES de escribir;
 * si el parse falla no hay side effects (devuelve false).
 */
export async function upsertVehicle(input: unknown): Promise<boolean> {
  const db = server();
  if (!db) return false;
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return false; // Zod primero: NUNCA escribir inválido
  const { error } = await db
    .from("vehicles_catalog")
    .upsert(vehicleRow(parsed.data), { onConflict: "internal_code" });
  return !error;
}

// ─── routes_catalog ───────────────────────────────────────

/** Todas las filas del catálogo de rutas (EN/FR, incluye inactivas). */
export async function listRoutes(): Promise<RouteRecord[] | null> {
  const db = server();
  if (!db) return null;
  const { data, error } = await db
    .from("routes_catalog")
    .select("slug, locale, frontmatter, body, active")
    .order("slug", { ascending: true });
  if (error || !Array.isArray(data)) return null;
  const routes: RouteRecord[] = [];
  for (const row of data as Array<{
    slug: string;
    locale: Locale;
    frontmatter: unknown;
    body: string;
    active: boolean;
  }>) {
    const data_ = routeData(row.frontmatter, row.locale, row.active);
    if (!data_) continue; // frontmatter corrupto: se omite sin romper el listado
    routes.push({ slug: row.slug, data: data_, body: row.body ?? "" });
  }
  return routes;
}

/** Ruta por slug+locale. null si no existe o el frontmatter es inválido. */
export async function getRoute(
  slug: string,
  locale: Locale
): Promise<RouteRecord | null> {
  const db = server();
  if (!db) return null;
  const { data, error } = await db
    .from("routes_catalog")
    .select("slug, locale, frontmatter, body, active")
    .eq("slug", slug)
    .eq("locale", locale)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    slug: string;
    locale: Locale;
    frontmatter: unknown;
    body: string;
    active: boolean;
  };
  const parsed = routeData(row.frontmatter, row.locale, row.active);
  if (!parsed) return null;
  return { slug: row.slug, data: parsed, body: row.body ?? "" };
}

/**
 * Upsert de una ruta (PK compuesta slug+locale). El frontmatter se valida con
 * routeSchema (inyectando locale) ANTES de escribir; active va a su columna y
 * el jsonb guarda solo los campos de contenido (contrato ADR-022).
 */
export async function upsertRoute(
  slug: string,
  locale: Locale,
  frontmatter: unknown,
  body: string
): Promise<boolean> {
  const db = server();
  if (!db) return false;
  const fm = (frontmatter as Record<string, unknown> | null) ?? {};
  const parsed = routeSchema.safeParse({ ...fm, locale }); // el locale param manda
  if (!parsed.success) return false; // Zod primero: NUNCA escribir inválido
  // El jsonb guarda solo los campos de contenido; locale y active viven en columnas
  const active = parsed.data.active;
  const content = { ...parsed.data } as Partial<typeof parsed.data>;
  delete content.locale;
  delete content.active;
  const { error } = await db.from("routes_catalog").upsert(
    {
      slug,
      locale,
      frontmatter: content,
      body,
      active,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug,locale" }
  );
  return !error;
}

// ─── site_config (singleton) ──────────────────────────────

/** Config central del sitio (branding/hero). null si falta o es inválido. */
export async function getSiteConfigRow(): Promise<SiteConfig | null> {
  const db = server();
  if (!db) return null;
  const { data, error } = await db
    .from("site_config")
    .select("config")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) return null;
  const parsed = siteConfigSchema.safeParse((data as { config: unknown }).config);
  return parsed.success ? parsed.data : null;
}

/** Upsert del singleton validado con siteConfigSchema antes de escribir. */
export async function putSiteConfig(config: unknown): Promise<boolean> {
  const db = server();
  if (!db) return false;
  const parsed = siteConfigSchema.safeParse(config);
  if (!parsed.success) return false; // Zod primero: NUNCA escribir inválido
  const { error } = await db
    .from("site_config")
    .upsert(
      { id: true, config: parsed.data, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  return !error;
}
