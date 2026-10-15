// TDD RED→GREEN — EJ-03: helpers de i18n (SDD §7.1)
// Comportamiento spec: tests/features/i18n-navigation.feature
import { describe, it, expect } from "vitest";
import {
  t,
  localizedPath,
  locales,
  defaultLocale,
  localeConfig,
  isLocale,
} from "@/lib/i18n";

describe("i18n constants", () => {
  it("supports exactly en and fr with en as default", () => {
    expect(locales).toEqual(["en", "fr"]);
    expect(defaultLocale).toBe("en");
    expect(localeConfig.en.htmlLang).toBe("en-CA");
    expect(localeConfig.fr.htmlLang).toBe("fr-CA");
    expect(localeConfig.en.ogLocale).toBe("en_CA");
    expect(localeConfig.fr.ogLocale).toBe("fr_CA");
  });

  it("isLocale narrows valid locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });
});

describe("t()", () => {
  it("resolves nested keys for english", () => {
    expect(t("en", "nav.vehicles")).toBe("Fleet");
  });

  it("resolves nested keys for french", () => {
    expect(t("fr", "nav.vehicles")).toBe("Flotte");
  });

  it("interpolates template variables", () => {
    expect(t("en", "hero.vehicles_available", { count: 4 })).toBe("4 RVs available");
  });

  it("returns the key when translation is missing", () => {
    expect(t("en", "not.a.real.key")).toBe("not.a.real.key");
  });

  it("leaves placeholder intact when var is missing", () => {
    expect(t("en", "hero.vehicles_available")).toBe("{count} RVs available");
  });
});

describe("localizedPath()", () => {
  it("prefixes english paths with /en", () => {
    expect(localizedPath("en", "/vehicles/2024-jayco-redhawk-26b")).toBe(
      "/en/vehicles/2024-jayco-redhawk-26b"
    );
  });

  it("translates segment and prefixes french paths with /fr", () => {
    expect(localizedPath("fr", "/vehicles/2024-jayco-redhawk-26b")).toBe(
      "/fr/vehicules/2024-jayco-redhawk-26b"
    );
  });

  it("translates routes to itineraires in french", () => {
    expect(localizedPath("fr", "/routes/rocky-mountains")).toBe(
      "/fr/itineraires/rocky-mountains"
    );
  });

  it("keeps faq and other segments as-is", () => {
    expect(localizedPath("fr", "/faq")).toBe("/fr/faq");
  });
});
