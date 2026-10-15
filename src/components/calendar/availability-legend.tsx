// src/components/calendar/availability-legend.tsx — Leyenda de estados (§7.1)
import { t, type Locale } from "@/lib/i18n";

interface AvailabilityLegendProps {
  locale: Locale;
}

const LEGEND = [
  { key: "calendar.available", color: "bg-status-available" },
  { key: "calendar.occupied", color: "bg-status-occupied" },
  { key: "calendar.maintenance", color: "bg-status-maintenance" },
  { key: "calendar.past", color: "bg-neutral-200" },
] as const;

export function AvailabilityLegend({ locale }: AvailabilityLegendProps) {
  return (
    <div
      className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-600"
      role="list"
      aria-label={t(locale, "calendar.legend")}
    >
      {LEGEND.map((item) => (
        <span key={item.key} role="listitem" className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded ${item.color}`} aria-hidden="true"></span>
          {t(locale, item.key)}
        </span>
      ))}
    </div>
  );
}

export default AvailabilityLegend;
