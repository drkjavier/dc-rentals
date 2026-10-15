// src/components/booking/booking-widget.tsx — island (client:visible)
// SDD §12.1 — solicitud de reserva SIN pago (ADR-011): el usuario envía la
// solicitud y el operador confirma en ≤24 h. Sin rastro de Stripe.
import { useState, type FormEvent } from "react";
import { PriceBreakdown } from "./price-breakdown";
import { ExtrasSelector } from "./extras-selector";
import { useBookingStore, type KmPackage } from "@/stores/booking-store";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface BookingWidgetProps {
  locale: Locale;
  vehicle: {
    internalCode: string;
    name: string;
    pricePerNightCAD: number;
    securityDepositCAD: number;
    status: string;
  };
}

const KM_OPTIONS: Array<{ value: KmPackage; km: number }> = [
  { value: "basic", km: 400 },
  { value: "standard", km: 800 },
  { value: "unlimited", km: Infinity },
];

const PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "ON",
  "PE",
  "QC",
  "SK",
  "NT",
  "NU",
  "YT",
] as const;

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; reservationId: string }
  | { kind: "error"; message: string };

export function BookingWidget({ locale, vehicle }: BookingWidgetProps) {
  const { startDate, endDate, kmPackage, extras, setKmPackage, toggleExtra } = useBookingStore();
  const [province, setProvince] = useState<string>("AB");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!startDate || !endDate) return;
    setState({ kind: "submitting" });

    const form = new FormData(event.currentTarget);
    const payload = {
      vehicleId: vehicle.internalCode,
      startDate,
      endDate,
      guestName: String(form.get("guestName") ?? ""),
      guestEmail: String(form.get("guestEmail") ?? ""),
      guestPhone: String(form.get("guestPhone") ?? "") || undefined,
      guestProvince: province,
      licenseType: String(form.get("licenseType") ?? "") || undefined,
      driverAge: Number(form.get("driverAge") ?? 0),
      kmPackage: kmPackage ?? undefined,
      extras,
      notes: String(form.get("notes") ?? "") || undefined,
    };

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        setState({ kind: "success", reservationId: data.reservationId });
      } else if (res.status === 409) {
        setState({ kind: "error", message: t(locale, "booking.error_dates_conflict") });
      } else if (res.status === 503) {
        setState({ kind: "error", message: t(locale, "booking.error_unavailable") });
      } else {
        setState({ kind: "error", message: t(locale, "booking.error_validation") });
      }
    } catch {
      setState({ kind: "error", message: t(locale, "booking.error_generic") });
    }
  };

  const inputClass =
    "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary";
  const labelClass = "text-sm font-medium text-neutral-700";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-heading text-lg font-bold text-neutral-900">
        {t(locale, "booking.from")} {vehicle.pricePerNightCAD}{" "}
        <span className="text-sm font-normal text-neutral-500">
          {t(locale, "booking.cad")}{t(locale, "booking.per_night")}
        </span>
      </h2>

      <p className="mt-2 rounded-lg bg-brand-primary/5 p-2 text-xs text-neutral-600">
        {t(locale, "booking.request_note")}
      </p>

      {state.kind === "success" ? (
        <div className="mt-4 rounded-lg bg-status-available/10 p-4" aria-live="polite">
          <p className="font-semibold text-status-available">
            ✓ {t(locale, "booking.success_title")}
          </p>
          <p className="mt-1 text-sm text-neutral-700">{t(locale, "booking.success_desc")}</p>
          <p className="mt-2 font-mono text-xs text-neutral-500">#{state.reservationId}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className={labelClass}>{t(locale, "booking.check_in")}</span>
              <p className="rounded-lg bg-neutral-50 px-3 py-2 font-mono text-xs">
                {startDate ?? "—"}
              </p>
            </div>
            <div>
              <span className={labelClass}>{t(locale, "booking.check_out")}</span>
              <p className="rounded-lg bg-neutral-50 px-3 py-2 font-mono text-xs">
                {endDate ?? "—"}
              </p>
            </div>
          </div>
          {!startDate && (
            <a href="#availability" className="text-xs font-medium text-brand-primary hover:underline">
              {t(locale, "calendar.select_start")} ↓
            </a>
          )}

          {/* Paquete de kilometraje */}
          <div>
            <label htmlFor="km-package" className={labelClass}>
              {t(locale, "booking.km_package", { km: "—" }).split("(")[0]}
            </label>
            <select
              id="km-package"
              className={cn(inputClass, "mt-1")}
              value={kmPackage ?? ""}
              onChange={(e) => setKmPackage((e.target.value || null) as KmPackage | null)}
            >
              <option value="">—</option>
              {KM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === "unlimited"
                    ? "Unlimited"
                    : `${opt.value} — ${opt.km} km`}
                </option>
              ))}
            </select>
          </div>

          <ExtrasSelector locale={locale} selected={extras} onToggle={toggleExtra} />

          <fieldset className="space-y-2 border-t border-neutral-200 pt-3">
            <legend className="text-sm font-medium text-neutral-800">
              {t(locale, "nav.contact")}
            </legend>
            <div>
              <label htmlFor="guestName" className={labelClass}>
                {t(locale, "booking.guest_name")} *
              </label>
              <input id="guestName" name="guestName" required minLength={2} className={cn(inputClass, "mt-1")} />
            </div>
            <div>
              <label htmlFor="guestEmail" className={labelClass}>
                {t(locale, "booking.guest_email")} *
              </label>
              <input id="guestEmail" name="guestEmail" type="email" required className={cn(inputClass, "mt-1")} />
            </div>
            <div>
              <label htmlFor="guestPhone" className={labelClass}>
                {t(locale, "booking.guest_phone")}
              </label>
              <input id="guestPhone" name="guestPhone" type="tel" className={cn(inputClass, "mt-1")} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="guestProvince" className={labelClass}>
                  {t(locale, "booking.guest_province")}
                </label>
                <select
                  id="guestProvince"
                  name="guestProvince"
                  className={cn(inputClass, "mt-1")}
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                >
                  {PROVINCES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="driverAge" className={labelClass}>
                  {t(locale, "booking.driver_age")} *
                </label>
                <input
                  id="driverAge"
                  name="driverAge"
                  type="number"
                  min={21}
                  max={99}
                  required
                  className={cn(inputClass, "mt-1")}
                />
              </div>
            </div>
            <div>
              <label htmlFor="licenseType" className={labelClass}>
                {t(locale, "booking.license_type")}
              </label>
              <input id="licenseType" name="licenseType" maxLength={20} className={cn(inputClass, "mt-1")} />
            </div>
            <div>
              <label htmlFor="notes" className={labelClass}>
                {t(locale, "booking.notes")}
              </label>
              <textarea id="notes" name="notes" maxLength={500} rows={2} className={cn(inputClass, "mt-1")} />
            </div>
          </fieldset>

          <div className="border-t border-neutral-200 pt-3">
            <h3 className="mb-2 text-sm font-semibold text-neutral-800">
              {t(locale, "booking.price_breakdown")}
            </h3>
            <PriceBreakdown
              locale={locale}
              nightlyRateCAD={vehicle.pricePerNightCAD}
              startDate={startDate}
              endDate={endDate}
              province={province}
              kmPackage={kmPackage}
              extras={extras}
              securityDepositCAD={vehicle.securityDepositCAD}
            />
          </div>

          {state.kind === "error" && (
            <p
              role="alert"
              className="rounded-lg bg-status-occupied/10 p-3 text-sm text-status-occupied"
            >
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={state.kind === "submitting" || !startDate || !endDate}
            className="w-full rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            {state.kind === "submitting"
              ? t(locale, "booking.submitting")
              : t(locale, "booking.request_now")}
          </button>
        </form>
      )}
    </div>
  );
}

export default BookingWidget;
