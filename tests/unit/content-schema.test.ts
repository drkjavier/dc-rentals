// TDD — EJ-07: validación del catálogo (equivalente al fallo de build de Astro
// si un JSON no cumple el schema, ejecutable en Vitest sin astro:content).
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { vehicleSchema, faqSchema } from "@/lib/content-schemas";
import { AMENITY_CATALOG } from "@/lib/amenities";
import { LOCATIONS } from "@/lib/locations";

const CONTENT_DIR = join(process.cwd(), "src", "content");

function readJson(relPath: string): any {
  return JSON.parse(readFileSync(join(CONTENT_DIR, relPath), "utf-8"));
}

const vehicleFiles = readdirSync(join(CONTENT_DIR, "vehicles")).filter((f) =>
  f.endsWith(".json")
);
const vehicles = vehicleFiles.map((f) => ({
  file: f,
  data: readJson(join("vehicles", f)),
}));

describe("vehicle content entries", () => {
  it("has at least 4 vehicles", () => {
    expect(vehicles.length).toBeGreaterThanOrEqual(4);
  });

  it.each(vehicleFiles)("%s validates against the Zod schema", (file) => {
    const data = vehicles.find((v) => v.file === file)!.data;
    const result = vehicleSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`${file}: ${JSON.stringify(result.error.flatten(), null, 2)}`);
    }
    expect(result.success).toBe(true);
  });

  it("all internalCodes are unique", () => {
    const codes = vehicles.map((v) => v.data.internalCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("all slugs are unique and kebab-case", () => {
    const slugs = vehicles.map((v) => v.data.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("every referenced amenity id exists in the catalog", () => {
    for (const v of vehicles) {
      for (const amenity of v.data.amenities) {
        expect(
          AMENITY_CATALOG[amenity.id],
          `${v.file}: unknown amenity "${amenity.id}"`
        ).toBeDefined();
      }
    }
  });

  it("every referenced location id exists", () => {
    for (const v of vehicles) {
      expect(
        LOCATIONS.find((l) => l.id === v.data.locationId),
        `${v.file}: unknown location "${v.data.locationId}"`
      ).toBeDefined();
    }
  });

  it("images use the naming convention per internalCode", () => {
    for (const v of vehicles) {
      for (const img of v.data.images) {
        expect(img.url).toMatch(
          new RegExp(`^/images/vehicles/${v.data.internalCode}/[a-z0-9-]+\\.svg$`)
        );
      }
    }
  });

  it("has vehicles of at least 4 different types for filtering", () => {
    const types = new Set(vehicles.map((v) => v.data.type));
    expect(types.size).toBeGreaterThanOrEqual(4);
  });
});

describe("faq content entries", () => {
  // Nota ADR-019 (Astro 5): el glob loader requiere un objeto JSON por
  // archivo, así que faq.json (array) se dividió en faq/<id>.<locale>.json.
  const faqFiles = readdirSync(join(CONTENT_DIR, "faq")).filter((f) =>
    f.endsWith(".json")
  );
  const faqItems = faqFiles.map((f) =>
    faqSchema.parse(readJson(join("faq", f)))
  );

  it("every entry validates against the schema", () => {
    expect(faqItems.length).toBeGreaterThan(0);
  });

  it("has both en and fr translations for every question id", () => {
    const enIds = faqItems.filter((f) => f.locale === "en").map((f) => f.id);
    const frIds = faqItems.filter((f) => f.locale === "fr").map((f) => f.id);
    expect(enIds.sort()).toEqual(frIds.sort());
  });
});

describe("routes content entries", () => {
  const routeFiles = readdirSync(join(CONTENT_DIR, "routes")).filter((f) =>
    f.endsWith(".mdx")
  );

  it("has at least 3 routes with en and fr versions", () => {
    const bases = routeFiles.map((f) => f.replace(/\.(en|fr)\.mdx$/, ""));
    const uniqueBases = new Set(bases);
    expect(uniqueBases.size).toBeGreaterThanOrEqual(3);
    for (const base of uniqueBases) {
      expect(routeFiles).toContain(`${base}.en.mdx`);
      expect(routeFiles).toContain(`${base}.fr.mdx`);
    }
  });
});
