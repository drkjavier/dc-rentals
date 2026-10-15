// src/components/booking/price-breakdown.tsx — Desglose de precio en vivo
// Usa la MISMA función pura que el server (SDD §11).
import { calculatePrice, formatCAD, type KmPackageId } from "@/lib/pricing";
import type { ExtraSelection } from "@/stores/booking-store";
import { t, type Locale } from "@/lib/i18n";

interface PriceBreakdownProps {
  locale: Locale;
  nightlyRateCAD: number;
  startDate: string | null;
  endDate: string | null;
  province: string;
  kmPackage: KmPackageId | null;
  extras: ExtraSelection[];
  securityDepositCAD: number;
}

export function PriceBreakdown({
  locale,
  nightlyRateCAD,
  startDate,
  endDate,
  province,
  kmPackage,
  extras,
  securityDepositCAD,
}: PriceBreakdownProps) {
  if (!startDate || !endDate) {
    return <p className="text-sm text-neutral-500">{t(locale, "booking.select_dates_hint")}</p>;
  }

  const breakdown = calculatePrice({
    nightlyRateCAD,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    province,
    kmPackageId: kmPackage ?? undefined,
    extras,
    securityDepositCAD,
  });

  return (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-neutral-600">
          {t(locale, "booking.base_rate", { nights: breakdown.nights })}
        </dt>
        <dd className="font-mono text-xs">{formatCAD(breakdown.baseRateCAD, locale)}</dd>
      </div>
      {breakdown.kmPackage && (
        <div className="flex justify-between">
          <dt className="text-neutral-600">
            {breakdown.kmPackage.km === Infinity
              ? t(locale, "booking.km_none").replace("No ", "")
              : t(locale, "booking.km_package", { km: breakdown.kmPackage.km })}
          </dt>
          <dd className="font-mono text-xs">{formatCAD(breakdown.kmPackage.priceCAD, locale)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-neutral-600">
          {t(locale, "booking.insurance", { days: breakdown.nights })}
        </dt>
        <dd className="font-mono text-xs">{formatCAD(breakdown.insuranceCAD, locale)}</dd>
      </div>
      {breakdown.extras.map((extra) => (
        <div key={extra.name} className="flex justify-between">
          <dt className="text-neutral-600">
            {extra.name} × {extra.quantity}
          </dt>
          <dd className="font-mono text-xs">{formatCAD(extra.priceCAD, locale)}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-neutral-200 pt-1.5">
        <dt className="font-medium text-neutral-800">{t(locale, "booking.subtotal")}</dt>
        <dd className="font-mono text-xs font-medium">{formatCAD(breakdown.subtotalCAD, locale)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-neutral-600">{t(locale, "booking.tax", { taxLabel: breakdown.taxLabel })}</dt>
        <dd className="font-mono text-xs">{formatCAD(breakdown.taxCAD, locale)}</dd>
      </div>
      <div className="flex justify-between border-t border-neutral-200 pt-1.5 text-base font-bold text-neutral-900">
        <dt>{t(locale, "booking.total")}</dt>
        <dd>{formatCAD(breakdown.totalCAD, locale)}</dd>
      </div>
      <p className="text-xs text-neutral-500">
        {t(locale, "booking.security_deposit")}: {formatCAD(breakdown.securityDepositCAD, locale)}
      </p>
    </dl>
  );
}

export default PriceBreakdown;
