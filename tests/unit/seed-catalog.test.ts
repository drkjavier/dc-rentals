// tests/unit/seed-catalog.test.ts — TDD de la lógica pura de seed-catalog.ts
// (parsing de MDX, mapeo de vehículos y site-config). Sin red: los upserts
// de Supabase no se ejercitan aquí.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  parseRouteMdx,
  extractSlugAndLocale,
  routeMdxToRow,
  vehicleFileToRow,
  siteConfigFileToRow,
} from "../../scripts/seed-catalog";

// ─── Fixtures ──────────────────────────────────────────────

const MDX_EN = `---
locale: "en"
name: "Rocky Mountains Loop"
distance: "2,800 km"
stops:
  - name: "Calgary"
    lat: 51.0447
    lng: -114.0719
regionIds: ["AB", "BC"]
active: true
---

# Rocky Mountains Loop

Texto del body en **markdown**.
`;

// Vehículo mínimo válido según vehicleSchema (src/lib/content-schemas.ts).
const VALID_SPECS = {
  lengthM: 8.13,
  lengthFt: "26 ft 8 in",
  widthM: 2.59,
  widthIn: 102,
  heightM: 3.35,
  heightFt: "11 ft",
  interiorHeightM: 2.13,
  interiorHeightFt: "7 ft",
  areaSqm: 20,
  areaSqft: 215,
  freshWaterGal: 42,
  grayWaterGal: 31,
  blackWaterGal: 29,
  freshWaterL: 159,
  grayWaterL: 117,
  blackWaterL: 110,
  fuelCapacityGal: 55,
  fuelCapacityL: 208,
  gvwrLbs: 14500,
  gvwrKg: 6577,
  chassis: "Ford E-450",
  engine: "7.3L V8",
  transmission: "6-speed automatic",
  fuelType: "Gasoline",
  mpg: "8-12",
  mpgL100km: "29-19",
};

const VALID_VEHICLE = {
  internalCode: "DC-C3-001",
  slug: "2024-jayco-redhawk-26b",
  name: "2024 Jayco Redhawk 26B",
  brand: "Jayco",
  model: "Redhawk 26B",
  year: 2024,
  type: "CLASS_C",
  description: "Spacious Class C motorhome.",
  descriptionFr: "Camping-car de classe C spacieux.",
  sleepCapacity: 6,
  seatBelts: 6,
  pricePerNightCAD: 189,
  locationId: "calgary-depot",
  mainImage: "/images/vehicles/DC-C3-001/exterior-01.svg",
  specs: VALID_SPECS,
};

// ─── parseRouteMdx ─────────────────────────────────────────

describe("parseRouteMdx", () => {
  it("extrae frontmatter, body, slug y locale desde el nombre de archivo", () => {
    const parsed = parseRouteMdx(MDX_EN, "rocky-mountains.en.mdx");
    expect(parsed.slug).toBe("rocky-mountains");
    expect(parsed.locale).toBe("en");
    expect(parsed.frontmatter.name).toBe("Rocky Mountains Loop");
    expect(parsed.body).toContain("# Rocky Mountains Loop");
    expect(parsed.body).toContain("markdown");
    expect(parsed.body).not.toContain("---");
  });

  it("parsea tipos nativos de YAML (números y arrays)", () => {
    const parsed = parseRouteMdx(MDX_EN, "rocky-mountains.en.mdx");
    const stops = parsed.frontmatter.stops as Array<{ lat: number }>;
    expect(stops[0].lat).toBeCloseTo(51.0447);
    expect(parsed.frontmatter.regionIds).toEqual(["AB", "BC"]);
    expect(parsed.frontmatter.active).toBe(true);
  });

  it("deriva el locale del sufijo .fr.mdx", () => {
    const parsed = parseRouteMdx(MDX_EN.replace('"en"', '"fr"'), "rocky-mountains.fr.mdx");
    expect(parsed.slug).toBe("rocky-mountains");
    expect(parsed.locale).toBe("fr");
  });

  it("el sufijo del archivo tiene prioridad sobre el frontmatter", () => {
    const parsed = parseRouteMdx(MDX_EN, "rocky-mountains.fr.mdx");
    expect(parsed.locale).toBe("fr");
  });

  it("usa el frontmatter como fallback de locale sin sufijo", () => {
    const parsed = parseRouteMdx(MDX_EN, "rocky-mountains.mdx");
    expect(parsed.slug).toBe("rocky-mountains");
    expect(parsed.locale).toBe("en");
  });

  it("lanza error si no hay sufijo ni locale en el frontmatter", () => {
    const sinLocale = MDX_EN.replace('locale: "en"\n', "");
    expect(() => parseRouteMdx(sinLocale, "rocky-mountains.mdx")).toThrow(
      /locale/
    );
  });

  it("lanza error sin bloque frontmatter", () => {
    expect(() => parseRouteMdx("# Solo body\n", "x.en.mdx")).toThrow(
      /frontmatter no encontrado/
    );
  });

  it("lanza error con YAML inválido en el frontmatter", () => {
    const roto = '---\nname: "x"\nstops: [sin cerrar\n---\n\nbody\n';
    expect(() => parseRouteMdx(roto, "x.en.mdx")).toThrow(/YAML|flow|invalid/i);
  });
});

// ─── extractSlugAndLocale ──────────────────────────────────

describe("extractSlugAndLocale", () => {
  it("separa slug y locale de un nombre de archivo con sufijo", () => {
    expect(extractSlugAndLocale("vancouver-island.en.mdx", {})).toEqual({
      slug: "vancouver-island",
      locale: "en",
    });
  });

  it("acepta .md y frontmatter con locale en minúsculas inválido", () => {
    expect(() => extractSlugAndLocale("x.es.mdx", { locale: "de" })).toThrow(
      /locale/
    );
  });
});

// ─── routeMdxToRow ─────────────────────────────────────────

describe("routeMdxToRow", () => {
  it("mapea a la fila de routes_catalog con active=true por defecto", () => {
    const parsed = parseRouteMdx(MDX_EN, "rocky-mountains.en.mdx");
    const row = routeMdxToRow(parsed);
    expect(row.slug).toBe("rocky-mountains");
    expect(row.locale).toBe("en");
    expect(row.active).toBe(true);
    expect(row.body).toContain("Rocky Mountains Loop");
    expect(row.frontmatter.name).toBe("Rocky Mountains Loop");
  });

  it("respeta active=false del frontmatter", () => {
    const parsed = parseRouteMdx(
      MDX_EN.replace("active: true", "active: false"),
      "rocky-mountains.en.mdx"
    );
    expect(routeMdxToRow(parsed).active).toBe(false);
  });
});

// ─── vehicleFileToRow ──────────────────────────────────────

describe("vehicleFileToRow", () => {
  it("convierte un vehículo válido en la fila de vehicles_catalog", () => {
    const row = vehicleFileToRow(VALID_VEHICLE);
    expect(row.internal_code).toBe("DC-C3-001");
    expect(row.active).toBe(true);
    expect(row.featured).toBe(false);
    expect(row.data.slug).toBe("2024-jayco-redhawk-26b");
  });

  it("aplica los defaults del schema (status, securityDeposit, imágenes)", () => {
    const row = vehicleFileToRow(VALID_VEHICLE);
    expect(row.data.status).toBe("AVAILABLE");
    expect(row.data.securityDepositCAD).toBe(1000);
    expect(row.data.images).toEqual([]);
    expect(row.data.amenities).toEqual([]);
  });

  it("serializa fechas a ISO string (JSONB-safe)", () => {
    const row = vehicleFileToRow({
      ...VALID_VEHICLE,
      availableFromDate: "2026-06-01",
    });
    expect(typeof row.data.availableFromDate).toBe("string");
    expect(row.data.availableFromDate).toMatch(/^2026-06-01/);
    // Round-trip exacto: sin tipos no serializables (Date, undefined suelto).
    expect(JSON.parse(JSON.stringify(row.data))).toEqual(row.data);
  });

  it("lanza error con internalCode inválido", () => {
    expect(() =>
      vehicleFileToRow({ ...VALID_VEHICLE, internalCode: "INVALIDO" })
    ).toThrow(/vehículo inválido/);
  });

  it("lanza error con tipo de vehículo desconocido", () => {
    expect(() =>
      vehicleFileToRow({ ...VALID_VEHICLE, type: "CLASS_Z" })
    ).toThrow(/vehículo inválido/);
  });

  it("lanza error si faltan specs requeridas", () => {
    expect(() =>
      vehicleFileToRow({ ...VALID_VEHICLE, specs: { lengthM: 8 } })
    ).toThrow(/vehículo inválido/);
  });
});

// ─── siteConfigFileToRow ───────────────────────────────────

describe("siteConfigFileToRow", () => {
  it("acepta un objeto y lo devuelve tal cual", () => {
    const config = { brandName: "DC Rentals" };
    expect(siteConfigFileToRow(config)).toBe(config);
  });

  it("rechaza arrays, null y primitivos", () => {
    expect(() => siteConfigFileToRow([])).toThrow(/site-config inválido/);
    expect(() => siteConfigFileToRow(null)).toThrow(/site-config inválido/);
    expect(() => siteConfigFileToRow("x")).toThrow(/site-config inválido/);
  });
});

// ─── Contenido real del repo (sin red) ─────────────────────

describe("contenido real del repo", () => {
  const root = process.cwd();

  it("todos los MDX de src/content/routes parsean correctamente", () => {
    const files = readdirSync(join(root, "src", "content", "routes")).filter(
      (f) => f.endsWith(".mdx")
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(
        join(root, "src", "content", "routes", file),
        "utf-8"
      );
      const row = routeMdxToRow(parseRouteMdx(content, file));
      expect(row.slug.length).toBeGreaterThan(0);
      expect(["en", "fr"]).toContain(row.locale);
      expect(row.body.length).toBeGreaterThan(0);
    }
  });

  it("todos los JSON de src/content/vehicles generan filas válidas", () => {
    const files = readdirSync(join(root, "src", "content", "vehicles")).filter(
      (f) => f.endsWith(".json")
    );
    expect(files.length).toBeGreaterThanOrEqual(4);
    for (const file of files) {
      const raw: unknown = JSON.parse(
        readFileSync(join(root, "src", "content", "vehicles", file), "utf-8")
      );
      const row = vehicleFileToRow(raw);
      expect(row.internal_code).toMatch(/^DC-[A-Z0-9]+-\d+$/);
    }
  });

  it("src/config/site-config.json es un objeto válido", () => {
    const raw: unknown = JSON.parse(
      readFileSync(join(root, "src", "config", "site-config.json"), "utf-8")
    );
    const config = siteConfigFileToRow(raw);
    expect(config.brandName).toBe("DC Rentals");
  });
});
