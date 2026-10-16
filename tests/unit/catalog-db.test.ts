// tests/unit/catalog-db.test.ts — ADR-022
// CRUD del catálogo del panel /admin sobre Supabase:
// - validación Zod SIEMPRE antes de cualquier escritura (sin side effects)
// - mapeo de active/featured del objeto parseado a columnas consultables
// - null/false cuando Supabase no está configurado (ADR-014)
import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Mock del cliente Supabase ────────────────────────────
const db = vi.hoisted(() => ({
  server: null as any,
  calls: [] as Array<{ table: string; op: string; payload?: any; options?: any }>,
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: () => db.server,
  isSupabaseConfigured: () => db.server !== null,
}));

import {
  listVehicles,
  getVehicleByCode,
  upsertVehicle,
  listRoutes,
  getRoute,
  upsertRoute,
  getSiteConfigRow,
  putSiteConfig,
} from "@/lib/admin/catalog-db";

/** Cliente falso con cadena thenable (patrón de tests/unit/api.test.ts) */
function makeClient(tables: Record<string, { data: any; error: any }>) {
  return {
    from(table: string) {
      const result = tables[table] ?? { data: null, error: null };
      const q: any = {
        select: () => q,
        eq: () => q,
        order: () => q,
        maybeSingle: () => q,
        upsert: (payload: any, options?: any) => {
          db.calls.push({ table, op: "upsert", payload, options });
          return q;
        },
        then: (onF: any, onR: any) => Promise.resolve(result).then(onF, onR),
      };
      return q;
    },
  };
}

// ─── Fixtures ─────────────────────────────────────────────
const validVehicle = {
  internalCode: "DC-C3-001",
  slug: "jayco-redhawk-26b",
  name: "2024 Jayco Redhawk 26B",
  brand: "Jayco",
  model: "Redhawk 26B",
  year: 2024,
  type: "CLASS_C",
  description: "English description",
  descriptionFr: "Description française",
  sleepCapacity: 8,
  seatBelts: 8,
  petFriendly: true,
  pricePerNightCAD: 189,
  securityDepositCAD: 1000,
  locationId: "calgary",
  mainImage: "/images/vehicles/redhawk-1.webp",
  specs: {
    lengthM: 8.1,
    lengthFt: "26 ft 8 in",
    widthM: 2.5,
    widthIn: 98,
    heightM: 3.2,
    heightFt: "10 ft 6 in",
    interiorHeightM: 2.1,
    interiorHeightFt: "6 ft 11 in",
    areaSqm: 18,
    areaSqft: 194,
    freshWaterGal: 72,
    grayWaterGal: 41,
    blackWaterGal: 31,
    freshWaterL: 273,
    grayWaterL: 155,
    blackWaterL: 117,
    fuelCapacityGal: 55,
    fuelCapacityL: 208,
    gvwrLbs: 14500,
    gvwrKg: 6577,
    chassis: "Ford E-450",
    engine: "7.3L V8",
    transmission: "6-speed automatic",
    fuelType: "Gasolina",
    mpg: "8-12",
    mpgL100km: "29-19",
  },
  amenities: [{ id: "ac", detail: "Roof A/C" }],
  images: [
    { url: "/images/vehicles/redhawk-1.webp", alt: "Exterior", category: "EXTERIOR" },
  ],
  featured: true,
  active: true,
};

const validFrontmatter = {
  name: "Rocky Mountains",
  description: "The classic Rockies loop",
  distance: "2,800 km",
  duration: "7-10 days",
  difficulty: "moderate",
  bestSeason: "June–September",
  image: "/images/routes/rocky-mountains.webp",
  stops: [{ name: "Banff", lat: 51.1784, lng: -115.5708 }],
  highlights: ["Icefields Parkway"],
  regionIds: ["rocky-mountains"],
};

const validSiteConfig = {
  brandName: "DC Rentals",
  logo: { type: "icon", icon: "van", image: null, backgroundColor: "#1E40AF" },
  hero: { image: "/images/hero/hero-rv.svg", overlayOpacity: 60 },
};

beforeEach(() => {
  db.server = null;
  db.calls = [];
});

// ─── Degradación graceful sin Supabase (ADR-014) ──────────
describe("sin Supabase configurado", () => {
  it("todas las lecturas devuelven null y las escrituras false, sin tocar la DB", async () => {
    expect(await listVehicles()).toBeNull();
    expect(await getVehicleByCode("DC-C3-001")).toBeNull();
    expect(await listRoutes()).toBeNull();
    expect(await getRoute("rocky-mountains", "en")).toBeNull();
    expect(await getSiteConfigRow()).toBeNull();

    expect(await upsertVehicle(validVehicle)).toBe(false);
    expect(await upsertRoute("rocky-mountains", "en", validFrontmatter, "body")).toBe(false);
    expect(await putSiteConfig(validSiteConfig)).toBe(false);

    expect(db.calls).toHaveLength(0);
  });
});

// ─── vehicles_catalog ─────────────────────────────────────
describe("upsertVehicle", () => {
  beforeEach(() => {
    db.server = makeClient({ vehicles_catalog: { data: null, error: null } });
  });

  it("NO escribe si el parse Zod falla (devuelve false sin side effects)", async () => {
    const invalid = { ...validVehicle, internalCode: "codigo-invalido", year: "no-numero" };
    const ok = await upsertVehicle(invalid);
    expect(ok).toBe(false);
    expect(db.calls).toHaveLength(0);
  });

  it("escribe la fila completa con internal_code y columnas active/featured derivadas", async () => {
    const ok = await upsertVehicle(validVehicle);
    expect(ok).toBe(true);
    expect(db.calls).toHaveLength(1);
    const { table, payload, options } = db.calls[0];
    expect(table).toBe("vehicles_catalog");
    expect(payload.internal_code).toBe("DC-C3-001");
    expect(payload.data.internalCode).toBe("DC-C3-001");
    expect(payload.active).toBe(true); // derivada del objeto parseado
    expect(payload.featured).toBe(true);
    expect(typeof payload.updated_at).toBe("string");
    expect(options?.onConflict).toBe("internal_code");
  });

  it("aplica los defaults del schema (status, active=true, featured=false)", async () => {
    const sinFlags: Record<string, unknown> = { ...validVehicle };
    delete sinFlags.featured;
    delete sinFlags.active;
    const ok = await upsertVehicle(sinFlags);
    expect(ok).toBe(true);
    const { payload } = db.calls[0];
    expect(payload.data.status).toBe("AVAILABLE");
    expect(payload.active).toBe(true);
    expect(payload.featured).toBe(false);
  });

  it("devuelve false si la escritura falla en la DB", async () => {
    db.server = makeClient({
      vehicles_catalog: { data: null, error: { message: "RLS denegado" } },
    });
    expect(await upsertVehicle(validVehicle)).toBe(false);
  });
});

describe("listVehicles / getVehicleByCode", () => {
  it("lee y parsea las filas, usando las columnas active/featured como verdad", async () => {
    db.server = makeClient({
      vehicles_catalog: {
        data: [
          { data: validVehicle, active: false, featured: false },
          { data: { ...validVehicle, internalCode: "DC-CB-002" }, active: true, featured: true },
        ],
        error: null,
      },
    });
    const vehicles = await listVehicles();
    expect(vehicles).toHaveLength(2);
    expect(vehicles![0].internalCode).toBe("DC-C3-001");
    expect(vehicles![0].active).toBe(false); // columna manda sobre el jsonb
    expect(vehicles![0].featured).toBe(false);
    expect(vehicles![1].active).toBe(true);
  });

  it("omite filas con data corrupta sin romper el listado", async () => {
    db.server = makeClient({
      vehicles_catalog: {
        data: [
          { data: { internalCode: "ROTO" }, active: true, featured: false },
          { data: validVehicle, active: true, featured: true },
        ],
        error: null,
      },
    });
    const vehicles = await listVehicles();
    expect(vehicles).toHaveLength(1);
    expect(vehicles![0].internalCode).toBe("DC-C3-001");
  });

  it("getVehicleByCode devuelve el vehículo parseado (código insensible a mayúsculas)", async () => {
    db.server = makeClient({
      vehicles_catalog: { data: { data: validVehicle, active: true, featured: true }, error: null },
    });
    const vehicle = await getVehicleByCode("dc-c3-001");
    expect(vehicle?.internalCode).toBe("DC-C3-001");
    expect(vehicle?.name).toBe("2024 Jayco Redhawk 26B");
  });

  it("getVehicleByCode devuelve null si no existe o el jsonb es inválido", async () => {
    db.server = makeClient({ vehicles_catalog: { data: null, error: null } });
    expect(await getVehicleByCode("DC-XX-999")).toBeNull();

    db.server = makeClient({
      vehicles_catalog: { data: { data: { nada: true }, active: true, featured: false }, error: null },
    });
    expect(await getVehicleByCode("DC-XX-999")).toBeNull();
  });
});

// ─── routes_catalog ───────────────────────────────────────
describe("upsertRoute", () => {
  beforeEach(() => {
    db.server = makeClient({ routes_catalog: { data: null, error: null } });
  });

  it("NO escribe si el frontmatter es inválido (devuelve false sin side effects)", async () => {
    const ok = await upsertRoute("rocky-mountains", "en", { name: "" }, "body");
    expect(ok).toBe(false);
    expect(db.calls).toHaveLength(0);
  });

  it("escribe slug+locale como PK, active como columna y frontmatter sin locale/active", async () => {
    const ok = await upsertRoute("rocky-mountains", "fr", validFrontmatter, "Contenu MDX");
    expect(ok).toBe(true);
    const { table, payload, options } = db.calls[0];
    expect(table).toBe("routes_catalog");
    expect(payload.slug).toBe("rocky-mountains");
    expect(payload.locale).toBe("fr");
    expect(payload.active).toBe(true); // default del schema
    expect(payload.body).toBe("Contenu MDX");
    // el jsonb de frontmatter guarda solo los campos de contenido (contrato ADR-022)
    expect(payload.frontmatter.name).toBe("Rocky Mountains");
    expect(payload.frontmatter).not.toHaveProperty("locale");
    expect(payload.frontmatter).not.toHaveProperty("active");
    expect(options?.onConflict).toBe("slug,locale");
  });

  it("refleja active=false del frontmatter en la columna consultable", async () => {
    const ok = await upsertRoute("rocky-mountains", "en", { ...validFrontmatter, active: false }, "x");
    expect(ok).toBe(true);
    expect(db.calls[0].payload.active).toBe(false);
  });
});

describe("listRoutes / getRoute", () => {
  it("reconstruye data completa (frontmatter + locale + active) y body", async () => {
    db.server = makeClient({
      routes_catalog: {
        data: [
          {
            slug: "rocky-mountains",
            locale: "en",
            frontmatter: validFrontmatter,
            body: "# Intro",
            active: true,
          },
        ],
        error: null,
      },
    });
    const routes = await listRoutes();
    expect(routes).toHaveLength(1);
    expect(routes![0].slug).toBe("rocky-mountains");
    expect(routes![0].data.locale).toBe("en");
    expect(routes![0].data.active).toBe(true);
    expect(routes![0].data.name).toBe("Rocky Mountains");
    expect(routes![0].body).toBe("# Intro");
  });

  it("getRoute devuelve la ruta del locale pedido o null", async () => {
    db.server = makeClient({
      routes_catalog: {
        data: {
          slug: "rocky-mountains",
          locale: "fr",
          frontmatter: validFrontmatter,
          body: "Contenu",
          active: false,
        },
        error: null,
      },
    });
    const route = await getRoute("rocky-mountains", "fr");
    expect(route?.data.locale).toBe("fr");
    expect(route?.data.active).toBe(false);
    expect(route?.body).toBe("Contenu");
  });

  it("omite filas con frontmatter inválido sin romper el listado", async () => {
    db.server = makeClient({
      routes_catalog: {
        data: [
          { slug: "rota", locale: "en", frontmatter: { name: "" }, body: "", active: true },
          { slug: "rocky-mountains", locale: "en", frontmatter: validFrontmatter, body: "x", active: true },
        ],
        error: null,
      },
    });
    const routes = await listRoutes();
    expect(routes).toHaveLength(1);
    expect(routes![0].slug).toBe("rocky-mountains");
  });
});

// ─── site_config (singleton) ──────────────────────────────
describe("putSiteConfig / getSiteConfigRow", () => {
  beforeEach(() => {
    db.server = makeClient({ site_config: { data: null, error: null } });
  });

  it("NO escribe si el config es inválido (devuelve false sin side effects)", async () => {
    const ok = await putSiteConfig({ ...validSiteConfig, brandName: "" });
    expect(ok).toBe(false);
    expect(db.calls).toHaveLength(0);
  });

  it("escribe el singleton id=true con el config validado", async () => {
    const ok = await putSiteConfig(validSiteConfig);
    expect(ok).toBe(true);
    const { table, payload, options } = db.calls[0];
    expect(table).toBe("site_config");
    expect(payload.id).toBe(true);
    expect(payload.config.brandName).toBe("DC Rentals");
    expect(options?.onConflict).toBe("id");
  });

  it("getSiteConfigRow devuelve el config parseado o null si falta/es inválido", async () => {
    db.server = makeClient({ site_config: { data: { config: validSiteConfig }, error: null } });
    const row = await getSiteConfigRow();
    expect(row?.brandName).toBe("DC Rentals");
    expect(row?.hero.overlayOpacity).toBe(60);

    db.server = makeClient({ site_config: { data: { config: { brandName: "" } }, error: null } });
    expect(await getSiteConfigRow()).toBeNull();

    db.server = makeClient({ site_config: { data: null, error: null } });
    expect(await getSiteConfigRow()).toBeNull();
  });
});
