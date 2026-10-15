// tests/unit/admin-site-config.test.ts — ADR-020
// Valida el schema del config central del sitio (branding/hero) que el panel
// admin commitea: si el JSON es inválido, el schema debe rechazarlo.
import { describe, it, expect } from "vitest";
import { siteConfigSchema, getSiteConfig } from "@/lib/site-config";

describe("siteConfigSchema", () => {
  it("acepta el config por defecto (marca, logo icono, hero)", () => {
    const parsed = siteConfigSchema.parse({
      brandName: "DC Rentals",
      logo: { type: "icon", icon: "van", image: null, backgroundColor: "#1E40AF" },
      hero: { image: "/images/hero/hero-rv.svg", overlayOpacity: 60 },
    });
    expect(parsed.brandName).toBe("DC Rentals");
    expect(parsed.logo.icon).toBe("van");
    expect(parsed.hero.overlayOpacity).toBe(60);
  });

  it("aplica defaults cuando faltan campos opcionales", () => {
    const parsed = siteConfigSchema.parse({});
    expect(parsed.brandName).toBe("DC Rentals");
    expect(parsed.logo.type).toBe("icon");
    expect(parsed.logo.backgroundColor).toBe("#1E40AF");
    expect(parsed.hero.image).toBe("/images/hero/hero-rv.svg");
  });

  it("rechaza un brandName vacío", () => {
    const result = siteConfigSchema.safeParse({ brandName: "" });
    expect(result.success).toBe(false);
  });

  it("rechaza un backgroundColor que no sea hex #RRGGBB", () => {
    const result = siteConfigSchema.safeParse({
      logo: { type: "icon", icon: "van", image: null, backgroundColor: "azul" },
    });
    expect(result.success).toBe(false);
  });

  it("acepta un backgroundColor hex válido", () => {
    const result = siteConfigSchema.safeParse({
      logo: { type: "icon", icon: "mountain", image: null, backgroundColor: "#059669" },
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un icono fuera del catálogo", () => {
    const result = siteConfigSchema.safeParse({
      logo: { type: "icon", icon: "cohete", image: null, backgroundColor: "#1E40AF" },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un overlayOpacity fuera de 0-100", () => {
    expect(
      siteConfigSchema.safeParse({ hero: { image: "/x.svg", overlayOpacity: 150 } }).success
    ).toBe(false);
    expect(
      siteConfigSchema.safeParse({ hero: { image: "/x.svg", overlayOpacity: -5 } }).success
    ).toBe(false);
  });

  it("acepta un logo de tipo imagen con ruta", () => {
    const result = siteConfigSchema.safeParse({
      logo: { type: "image", icon: "van", image: "/images/logo.png", backgroundColor: "#1E40AF" },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.logo.image).toBe("/images/logo.png");
  });
});

describe("getSiteConfig (config real del repo)", () => {
  it("el site-config.json del repo es válido", () => {
    const config = getSiteConfig();
    expect(config.brandName.length).toBeGreaterThan(0);
    expect(config.hero.image).toMatch(/^\//); // ruta relativa a /public
  });
});
