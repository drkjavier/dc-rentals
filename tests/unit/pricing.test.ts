// TDD RED→GREEN — EJ-08: motor de precios (SDD §11)
// Comportamiento spec: tests/features/pricing-engine.feature
import { describe, it, expect } from "vitest";
import {
  calculatePrice,
  getSeasonalRate,
  formatCAD,
  KM_PACKAGES,
  EXTRAS_CATALOG,
  TAX_RATES,
} from "@/lib/pricing";

describe("calculatePrice", () => {
  it("calculates basic 5-night booking correctly (spec §15.2)", () => {
    const result = calculatePrice({
      nightlyRateCAD: 189,
      startDate: new Date("2026-08-15"),
      endDate: new Date("2026-08-20"),
      province: "AB",
      kmPackageId: "standard",
      insurancePerDayCAD: 25,
      securityDepositCAD: 1000,
    });

    expect(result.nights).toBe(5);
    expect(result.baseRateCAD).toBe(945);
    expect(result.kmPackage?.priceCAD).toBe(300);
    expect(result.kmPackage?.km).toBe(800);
    expect(result.insuranceCAD).toBe(125);
    expect(result.subtotalCAD).toBe(1370);
    expect(result.taxRate).toBe(0.05); // Alberta GST
    expect(result.taxLabel).toBe("GST");
    expect(result.taxCAD).toBe(68.5);
    expect(result.totalCAD).toBe(1438.5);
    expect(result.securityDepositCAD).toBe(1000);
  });

  it("calculates Quebec taxes correctly", () => {
    const result = calculatePrice({
      nightlyRateCAD: 200,
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-08"),
      province: "QC",
    });
    expect(result.nights).toBe(7);
    expect(result.taxRate).toBe(0.14975);
    expect(result.taxLabel).toBe("GST + QST");
  });

  it("applies Ontario HST 13%", () => {
    const result = calculatePrice({
      nightlyRateCAD: 100,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-04"),
      province: "ON",
      insurancePerDayCAD: 0,
    });
    expect(result.taxRate).toBe(0.13);
    expect(result.taxLabel).toBe("HST");
    expect(result.subtotalCAD).toBe(300);
    expect(result.taxCAD).toBe(39);
    expect(result.totalCAD).toBe(339);
  });

  it("falls back to Alberta GST for unknown province", () => {
    const result = calculatePrice({
      nightlyRateCAD: 100,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-02"),
      province: "XX",
    });
    expect(result.taxRate).toBe(0.05);
    expect(result.taxLabel).toBe("GST");
  });

  it("charges per-day extras multiplied by nights and quantity", () => {
    const result = calculatePrice({
      nightlyRateCAD: 100,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-04"), // 3 nights
      province: "AB",
      insurancePerDayCAD: 0,
      extras: [
        { id: "wifi-hotspot", quantity: 1 }, // 10/day × 3 = 30
        { id: "linen-kit", quantity: 2 }, // 95 × 2 = 190
        { id: "does-not-exist", quantity: 5 }, // ignorado
      ],
    });
    expect(result.extras).toHaveLength(2);
    const wifi = result.extras.find((e) => e.isPerDay);
    expect(wifi?.priceCAD).toBe(30);
    expect(result.extrasTotalCAD).toBe(220);
    expect(result.subtotalCAD).toBe(520); // 300 base + 220 extras
  });

  it("supports the unlimited kilometre package", () => {
    const result = calculatePrice({
      nightlyRateCAD: 100,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-02"),
      province: "AB",
      insurancePerDayCAD: 0,
      kmPackageId: "unlimited",
    });
    expect(result.kmPackage?.priceCAD).toBe(500);
  });

  it("ignores unknown km package ids", () => {
    const result = calculatePrice({
      nightlyRateCAD: 100,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-02"),
      province: "AB",
      insurancePerDayCAD: 0,
      kmPackageId: "gold",
    });
    expect(result.kmPackage).toBeNull();
    expect(result.subtotalCAD).toBe(100);
  });

  it("rounds totals with ±0.01 tolerance", () => {
    const result = calculatePrice({
      nightlyRateCAD: 189,
      startDate: new Date("2026-08-15"),
      endDate: new Date("2026-08-21"), // 6 nights
      province: "QC",
    });
    const expectedTax = Math.round(result.subtotalCAD * 0.14975 * 100) / 100;
    expect(Math.abs(result.taxCAD - expectedTax)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(result.totalCAD - (result.subtotalCAD + result.taxCAD))).toBeLessThanOrEqual(
      0.01
    );
  });

  it("handles same-day range as 0 nights (sad path)", () => {
    const result = calculatePrice({
      nightlyRateCAD: 189,
      startDate: new Date("2026-08-15"),
      endDate: new Date("2026-08-15"),
      province: "AB",
      insurancePerDayCAD: 25,
    });
    expect(result.nights).toBe(0);
    expect(result.baseRateCAD).toBe(0);
    expect(result.insuranceCAD).toBe(0);
    expect(result.totalCAD).toBe(0);
  });

  it("uses default insurance of 25 CAD/day when not provided", () => {
    const result = calculatePrice({
      nightlyRateCAD: 100,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-03"),
      province: "AB",
    });
    expect(result.insuranceCAD).toBe(50);
  });

  it("defaults security deposit to 1000", () => {
    const result = calculatePrice({
      nightlyRateCAD: 100,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-02"),
      province: "AB",
    });
    expect(result.securityDepositCAD).toBe(1000);
  });
});

describe("getSeasonalRate", () => {
  it("applies peak multiplier in July", () => {
    expect(getSeasonalRate(189, new Date("2026-07-15"))).toBe(255.15); // ×1.35
  });
  it("applies low season multiplier in January", () => {
    expect(getSeasonalRate(189, new Date("2026-01-15"))).toBe(141.75); // ×0.75
  });
  it("applies high season multiplier in June", () => {
    expect(getSeasonalRate(189, new Date("2026-06-15"))).toBe(189); // ×1.0
  });
  it("applies medium season multiplier in October", () => {
    expect(getSeasonalRate(200, new Date("2026-10-10"))).toBe(190); // ×0.95
  });
});

describe("formatCAD", () => {
  // Intl en-CA/fr-CA usan símbolo "$" (CAD se agrega en la UI junto al valor)
  // y espacios separadores de millas según CLDR del locale.
  const normalize = (s: string) => s.replace(/[\u202f\u00a0\u2009]/g, " ");

  it("formats en-CA currency", () => {
    expect(formatCAD(1438.5, "en")).toContain("1,438");
  });
  it("formats fr-CA currency", () => {
    expect(normalize(formatCAD(1438.5, "fr"))).toContain("1 438");
    expect(normalize(formatCAD(1438.5, "fr"))).toContain(",5");
  });
});

describe("catalogs", () => {
  it("defines the three kilometre packages", () => {
    expect(KM_PACKAGES.basic.km).toBe(400);
    expect(KM_PACKAGES.standard.priceCAD).toBe(300);
    expect(KM_PACKAGES.unlimited.priceCAD).toBe(500);
  });

  it("covers all Canadian provinces with tax rates", () => {
    for (const code of ["AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK"]) {
      expect(TAX_RATES[code]).toBeDefined();
      expect(TAX_RATES[code].rate).toBeGreaterThan(0);
    }
  });

  it("every extra has id, name (en/fr) and price", () => {
    for (const extra of EXTRAS_CATALOG) {
      expect(extra.id).toBeTruthy();
      expect(extra.name).toBeTruthy();
      expect(extra.nameFr).toBeTruthy();
      expect(extra.priceCAD).toBeGreaterThan(0);
    }
  });
});
