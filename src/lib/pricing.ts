// src/lib/pricing.ts — Motor de precios (funciones puras)
// SDD: TECHNICAL-SPEC.md §11 — misma función para el island (preview) y el
// endpoint del server (price_snapshot). Tolerancia de redondeo ±0.01.

export const KM_PACKAGES = {
  basic: { km: 400, priceCAD: 150 },
  standard: { km: 800, priceCAD: 300 },
  unlimited: { km: Infinity, priceCAD: 500 },
} as const;

export type KmPackageId = keyof typeof KM_PACKAGES;

export interface ExtraCatalogItem {
  id: string;
  name: string;
  nameFr: string;
  priceCAD: number;
  category: string;
  perDay?: boolean;
}

export const EXTRAS_CATALOG: ExtraCatalogItem[] = [
  { id: "linen-kit", name: "Linen Kit", nameFr: "Kit de litera", priceCAD: 95, category: "comfort" },
  { id: "kitchen-kit", name: "Kitchen Convenience Kit", nameFr: "Kit cuisine", priceCAD: 75, category: "kitchen" },
  { id: "gas-grill", name: "Portable Gas Grill", nameFr: "BBQ portable", priceCAD: 35, category: "outdoor" },
  { id: "camp-chairs", name: "Camping Chairs (set of 4)", nameFr: "Chaises de camping (jeu de 4)", priceCAD: 40, category: "outdoor" },
  { id: "bike-rack", name: "Bike Rack", nameFr: "Porte-vélos", priceCAD: 30, category: "outdoor" },
  { id: "wifi-hotspot", name: "WiFi Hotspot (5GB)", nameFr: "Hotspot WiFi (5Go)", priceCAD: 10, perDay: true, category: "tech" },
  { id: "smores-kit", name: "S'mores Kit", nameFr: "Kit S'mores", priceCAD: 15, category: "fun" },
  { id: "cooler", name: "Cooler Box", nameFr: "Glacière", priceCAD: 20, category: "kitchen" },
  { id: "outdoor-kit", name: "Premium Outdoor Kit", nameFr: "Kit outdoor premium", priceCAD: 99, category: "bundle" },
];

// Tasas de impuesto por provincia canadiense (SDD §11)
export const TAX_RATES: Record<string, { label: string; rate: number }> = {
  AB: { label: "GST", rate: 0.05 },
  BC: { label: "GST + PST", rate: 0.12 },
  MB: { label: "GST + PST", rate: 0.12 },
  NB: { label: "HST", rate: 0.15 },
  NL: { label: "HST", rate: 0.15 },
  NS: { label: "HST", rate: 0.15 },
  ON: { label: "HST", rate: 0.13 },
  PE: { label: "HST", rate: 0.15 },
  QC: { label: "GST + QST", rate: 0.14975 },
  SK: { label: "GST + PST", rate: 0.11 },
  NT: { label: "GST", rate: 0.05 },
  NU: { label: "GST", rate: 0.05 },
  YT: { label: "GST", rate: 0.05 },
};

export const DEFAULT_TAX_PROVINCE = "AB";

export const SEASON_MULTIPLIERS = {
  low: { months: [11, 12, 1, 2, 3], multiplier: 0.75 },
  medium: { months: [4, 10], multiplier: 0.95 },
  high: { months: [5, 6, 9], multiplier: 1.0 },
  peak: { months: [7, 8], multiplier: 1.35 },
} as const;

export interface PriceBreakdown {
  nights: number;
  nightlyRateCAD: number;
  baseRateCAD: number;
  kmPackage: { name: string; km: number; priceCAD: number } | null;
  insuranceCAD: number;
  extras: Array<{ name: string; priceCAD: number; quantity: number; isPerDay: boolean }>;
  extrasTotalCAD: number;
  deliveryCAD: number;
  subtotalCAD: number;
  taxLabel: string;
  taxRate: number;
  taxCAD: number;
  totalCAD: number;
  securityDepositCAD: number;
}

export interface PriceInput {
  nightlyRateCAD: number;
  startDate: Date;
  endDate: Date;
  province: string;
  kmPackageId?: string;
  insurancePerDayCAD?: number;
  extras?: Array<{ id: string; quantity: number }>;
  deliveryCAD?: number;
  securityDepositCAD?: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function calculatePrice(params: PriceInput): PriceBreakdown {
  const nights = Math.max(
    0,
    Math.ceil((params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const baseRateCAD = params.nightlyRateCAD * nights;

  let kmPackage: PriceBreakdown["kmPackage"] = null;
  if (params.kmPackageId && params.kmPackageId in KM_PACKAGES) {
    const pkg = KM_PACKAGES[params.kmPackageId as KmPackageId];
    kmPackage = { name: params.kmPackageId, km: pkg.km, priceCAD: pkg.priceCAD };
  }

  const insurancePerDay = params.insurancePerDayCAD ?? 25;
  const insuranceCAD = insurancePerDay * nights;

  const extrasBreakdown = (params.extras ?? [])
    .map((e) => {
      const item = EXTRAS_CATALOG.find((c) => c.id === e.id);
      if (!item) return null; // extras desconocidos se ignoran
      const isPerDay = item.perDay === true;
      return {
        name: item.name,
        priceCAD: isPerDay ? item.priceCAD * e.quantity * nights : item.priceCAD * e.quantity,
        quantity: e.quantity,
        isPerDay,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const extrasTotalCAD = extrasBreakdown.reduce((sum, e) => sum + e.priceCAD, 0);

  const subtotalCAD =
    baseRateCAD + (kmPackage?.priceCAD ?? 0) + insuranceCAD + extrasTotalCAD + (params.deliveryCAD ?? 0);

  const taxInfo = TAX_RATES[params.province] ?? TAX_RATES[DEFAULT_TAX_PROVINCE];
  const taxCAD = subtotalCAD * taxInfo.rate;
  const totalCAD = subtotalCAD + taxCAD;

  return {
    nights,
    nightlyRateCAD: params.nightlyRateCAD,
    baseRateCAD,
    kmPackage,
    insuranceCAD,
    extras: extrasBreakdown,
    extrasTotalCAD,
    deliveryCAD: params.deliveryCAD ?? 0,
    subtotalCAD,
    taxLabel: taxInfo.label,
    taxRate: taxInfo.rate,
    taxCAD: round2(taxCAD),
    totalCAD: round2(totalCAD),
    securityDepositCAD: params.securityDepositCAD ?? 1000,
  };
}

export function getSeasonalRate(baseRateCAD: number, date: Date): number {
  const month = date.getMonth() + 1;
  const season = Object.values(SEASON_MULTIPLIERS).find((s) =>
    (s.months as readonly number[]).includes(month)
  );
  return round2(baseRateCAD * (season?.multiplier ?? 1.0));
}

export function formatCAD(amount: number, locale: string = "en"): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
