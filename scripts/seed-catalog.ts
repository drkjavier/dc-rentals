// scripts/seed-catalog.ts — Semilla del catálogo en Supabase (ADR-022)
// Migra los archivos seed del repo a las tablas del panel /admin:
//   src/content/vehicles/*.json  → vehicles_catalog
//   src/content/routes/*.mdx     → routes_catalog
//   src/config/site-config.json  → site_config
// Ejecución: npm run seed:catalog (o npx tsx scripts/seed-catalog.ts)
// Requiere PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { load as loadYaml } from "js-yaml";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { vehicleSchema } from "../src/lib/content-schemas";
import { getSupabaseServer } from "../src/lib/supabase";

// ─── Rutas del repo (resueltas desde la ubicación del script) ───
const ROOT_DIR = fileURLToPath(new URL("../", import.meta.url));
const VEHICLES_DIR = join(ROOT_DIR, "src", "content", "vehicles");
const ROUTES_DIR = join(ROOT_DIR, "src", "content", "routes");
const SITE_CONFIG_PATH = join(ROOT_DIR, "src", "config", "site-config.json");

export type Locale = "en" | "fr";

// ─── Tipos de fila (mapean 1:1 con el schema de tablas) ───
export interface VehicleCatalogRow {
  internal_code: string;
  data: Record<string, unknown>;
  active: boolean;
  featured: boolean;
}

export interface RouteCatalogRow {
  slug: string;
  locale: Locale;
  frontmatter: Record<string, unknown>;
  body: string;
  active: boolean;
}

export interface RouteMdxParsed {
  frontmatter: Record<string, unknown>;
  body: string;
  slug: string;
  locale: Locale;
}

// ─── Parsing de MDX (funciones puras, testeables sin red) ───

/** Regex del bloque frontmatter: "---\n ... \n---" al inicio del archivo. */
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Deriva slug y locale a partir del nombre de archivo
 * (ej. "rocky-mountains.fr.mdx" → slug "rocky-mountains", locale "fr").
 * Si el archivo no tiene sufijo de idioma, el locale se toma del frontmatter.
 */
export function extractSlugAndLocale(
  fileName: string,
  frontmatter: Record<string, unknown>
): { slug: string; locale: Locale } {
  const base = fileName.replace(/\.mdx?$/, "");
  const suffixMatch = /^(.+)\.(en|fr)$/.exec(base);
  const slug = suffixMatch ? suffixMatch[1] : base;
  let locale: Locale | undefined = suffixMatch
    ? (suffixMatch[2] as Locale)
    : undefined;

  // Fallback: locale declarado en el frontmatter.
  const fmLocale = frontmatter.locale;
  if (!locale && (fmLocale === "en" || fmLocale === "fr")) {
    locale = fmLocale;
  }
  if (!locale) {
    throw new Error(
      `no se pudo determinar el locale de "${fileName}" ` +
        '(sufijo .en/.fr o frontmatter.locale requeridos)'
    );
  }
  if (slug.length === 0) {
    throw new Error(`no se pudo determinar el slug de "${fileName}"`);
  }
  return { slug, locale };
}

/**
 * Parsea un MDX de ruta: extrae el frontmatter YAML y el body markdown.
 * El locale del sufijo del archivo tiene prioridad sobre el del frontmatter.
 */
export function parseRouteMdx(content: string, fileName = ""): RouteMdxParsed {
  const match = FRONTMATTER_RE.exec(content);
  if (!match) {
    throw new Error(`frontmatter no encontrado en "${fileName || "contenido"}"`);
  }
  const parsed = loadYaml(match[1]);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(
      `frontmatter YAML inválido en "${fileName || "contenido"}" (se esperaba un objeto)`
    );
  }
  const frontmatter = parsed as Record<string, unknown>;
  const body = content.slice(match[0].length).trim();
  const { slug, locale } = extractSlugAndLocale(fileName, frontmatter);
  return { frontmatter, body, slug, locale };
}

/** Convierte un MDX ya parseado en la fila a upsert en routes_catalog. */
export function routeMdxToRow(parsed: RouteMdxParsed): RouteCatalogRow {
  // Round-trip por JSON para garantizar valores serializables a JSONB
  // (YAML puede producir fechas u otros tipos no JSON nativos).
  const frontmatter = JSON.parse(
    JSON.stringify(parsed.frontmatter)
  ) as Record<string, unknown>;
  return {
    slug: parsed.slug,
    locale: parsed.locale,
    frontmatter,
    body: parsed.body,
    active: frontmatter.active !== false,
  };
}

// ─── Mapeo de vehículos (función pura, testeable sin red) ───

/**
 * Valida un JSON de vehículo con `vehicleSchema` y lo convierte en la fila
 * a upsert en vehicles_catalog. Lanza Error con el detalle de Zod si falla
 * (el llamador decide warn + skip).
 */
export function vehicleFileToRow(raw: unknown): VehicleCatalogRow {
  const result = vehicleSchema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(raíz)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`vehículo inválido — ${detail}`);
  }
  const vehicle = result.data;
  // Round-trip por JSON: `availableFromDate` es un Date tras el parse de Zod
  // y JSONB necesita una cadena ISO.
  const data = JSON.parse(JSON.stringify(vehicle)) as Record<string, unknown>;
  return {
    internal_code: vehicle.internalCode,
    data,
    active: vehicle.active,
    featured: vehicle.featured,
  };
}

/** Valida site-config.json (debe ser un objeto JSON) para site_config.config. */
export function siteConfigFileToRow(raw: unknown): Record<string, unknown> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("site-config inválido (se esperaba un objeto JSON)");
  }
  return raw as Record<string, unknown>;
}

// ─── Cliente Supabase ───

/**
 * Resuelve el cliente Supabase con service role. Primero intenta
 * `getSupabaseServer()` (lee import.meta.env bajo Vite/Vitest); si no está
 * disponible (tsx no define import.meta.env), cae a un cliente creado con
 * process.env — misma llave y mismo comportamiento server-only.
 */
function resolveSupabaseClient(url: string, serviceKey: string): SupabaseClient {
  try {
    const client = getSupabaseServer();
    if (client) return client;
  } catch {
    // import.meta.env no existe fuera de Vite (ej. tsx): seguimos con process.env.
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Exige las env vars de service role; si faltan, imprime y sale con código 1. */
function requireServiceRoleEnv(): { url: string; serviceKey: string } {
  const url = process.env.PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("[seed:catalog] Faltan variables de entorno obligatorias:");
    if (!url) console.error("  - PUBLIC_SUPABASE_URL");
    if (!serviceKey) console.error("  - SUPABASE_SERVICE_ROLE_KEY");
    console.error(
      "[seed:catalog] Configúralas en tu entorno (o en .env.local) y vuelve a ejecutar."
    );
    process.exit(1);
  }
  return { url, serviceKey };
}

// ─── Flujo principal ───

interface SeedCounters {
  vehiclesOk: number;
  vehiclesSkipped: number;
  routesOk: number;
  routesSkipped: number;
  configOk: number;
  errors: string[];
}

async function seedVehicles(
  client: SupabaseClient,
  counters: SeedCounters
): Promise<void> {
  const files = readdirSync(VEHICLES_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    let row: VehicleCatalogRow;
    try {
      const raw: unknown = JSON.parse(
        readFileSync(join(VEHICLES_DIR, file), "utf-8")
      );
      row = vehicleFileToRow(raw);
    } catch (error) {
      counters.vehiclesSkipped += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[seed:catalog] AVISO — vehículo "${file}" omitido: ${message}`);
      continue;
    }
    const { error } = await client
      .from("vehicles_catalog")
      .upsert({ ...row, updated_at: new Date().toISOString() }, {
        onConflict: "internal_code",
      });
    if (error) {
      counters.errors.push(`vehicles_catalog/${file}: ${error.message}`);
    } else {
      counters.vehiclesOk += 1;
    }
  }
}

async function seedRoutes(
  client: SupabaseClient,
  counters: SeedCounters
): Promise<void> {
  const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".mdx"));
  for (const file of files) {
    let row: RouteCatalogRow;
    try {
      const parsed = parseRouteMdx(
        readFileSync(join(ROUTES_DIR, file), "utf-8"),
        file
      );
      row = routeMdxToRow(parsed);
    } catch (error) {
      counters.routesSkipped += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[seed:catalog] AVISO — ruta "${file}" omitida: ${message}`);
      continue;
    }
    const { error } = await client
      .from("routes_catalog")
      .upsert({ ...row, updated_at: new Date().toISOString() }, {
        onConflict: "slug,locale",
      });
    if (error) {
      counters.errors.push(`routes_catalog/${file}: ${error.message}`);
    } else {
      counters.routesOk += 1;
    }
  }
}

async function seedSiteConfig(
  client: SupabaseClient,
  counters: SeedCounters
): Promise<void> {
  try {
    const raw: unknown = JSON.parse(readFileSync(SITE_CONFIG_PATH, "utf-8"));
    const config = siteConfigFileToRow(raw);
    const { error } = await client
      .from("site_config")
      .upsert(
        { id: true, config, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    if (error) {
      counters.errors.push(`site_config: ${error.message}`);
    } else {
      counters.configOk = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    counters.errors.push(`site_config: ${message}`);
    console.warn(`[seed:catalog] AVISO — site-config omitido: ${message}`);
  }
}

export async function runSeed(): Promise<SeedCounters> {
  const { url, serviceKey } = requireServiceRoleEnv();
  const client = resolveSupabaseClient(url, serviceKey);
  const counters: SeedCounters = {
    vehiclesOk: 0,
    vehiclesSkipped: 0,
    routesOk: 0,
    routesSkipped: 0,
    configOk: 0,
    errors: [],
  };

  await seedVehicles(client, counters);
  await seedRoutes(client, counters);
  await seedSiteConfig(client, counters);

  console.warn(
    `[seed:catalog] Resumen → vehículos: ${counters.vehiclesOk} ok / ` +
      `${counters.vehiclesSkipped} omitidos; rutas: ${counters.routesOk} ok / ` +
      `${counters.routesSkipped} omitidas; site_config: ${counters.configOk} ok; ` +
      `errores: ${counters.errors.length}`
  );
  for (const err of counters.errors) {
    console.error(`[seed:catalog] ERROR — ${err}`);
  }
  return counters;
}

// Solo ejecuta el flujo principal si el archivo es el entrypoint
// (npx tsx scripts/seed-catalog.ts), no al importarlo desde los tests.
const isEntrypoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  runSeed()
    .then((counters) => {
      process.exit(counters.errors.length > 0 ? 1 : 0);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[seed:catalog] FALLO inesperado: ${message}`);
      process.exit(1);
    });
}
