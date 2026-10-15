// src/components/calendar/availability-calendar.tsx — island (client:visible)
// SDD §10.2 — calendario mensual con selección de rango y fetch de disponibilidad.
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayCell } from "./day-cell";
import { AvailabilityLegend } from "./availability-legend";
import { useAvailability } from "@/hooks/use-availability";
import { useBookingStore } from "@/stores/booking-store";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface AvailabilityCalendarProps {
  vehicleId: string;
  locale: Locale;
  initialYear?: number;
  initialMonth?: number;
}

const MONTH_KEYS = [
  "calendar.month_jan",
  "calendar.month_feb",
  "calendar.month_mar",
  "calendar.month_apr",
  "calendar.month_may",
  "calendar.month_jun",
  "calendar.month_jul",
  "calendar.month_aug",
  "calendar.month_sep",
  "calendar.month_oct",
  "calendar.month_nov",
  "calendar.month_dec",
] as const;

export function AvailabilityCalendar({
  vehicleId,
  locale,
  initialYear,
  initialMonth,
}: AvailabilityCalendarProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(initialYear ?? now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? now.getMonth() + 1);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const { days, isLoading } = useAvailability(vehicleId, currentYear, currentMonth);
  const setDates = useBookingStore((s) => s.setDates);

  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
      weekday: "narrow",
      timeZone: "America/Toronto",
    });
    // Genera 7 días consecutivos de una semana conocida (2024-01-01 = lunes)
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(Date.UTC(2024, 0, 1 + i)))
    );
  }, [locale]);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setRangeStart(null);
    setRangeEnd(null);
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setRangeStart(null);
    setRangeEnd(null);
  };

  // Rellena la grilla con celdas vacías hasta alinear el primer día de semana
  const leadingBlanks = days.length > 0 ? weekdayLabels.indexOf(
    new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
      weekday: "narrow",
      timeZone: "America/Toronto",
    }).format(new Date(`${days[0].date}T12:00:00Z`))
  ) : 0;

  const handleDayClick = (date: string) => {
    if (!rangeStart || rangeEnd) {
      setRangeStart(date);
      setRangeEnd(null);
    } else if (date > rangeStart) {
      setRangeEnd(date);
      setDates(rangeStart, date);
    } else {
      setRangeStart(date);
    }
  };

  const monthLabel = `${t(locale, MONTH_KEYS[currentMonth - 1])} ${currentYear}`;

  return (
    <section aria-label={t(locale, "calendar.title")}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          aria-label={t(locale, "calendar.prev_month")}
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <h3 className="font-heading font-semibold text-neutral-900" aria-live="polite">
          {monthLabel}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          aria-label={t(locale, "calendar.next_month")}
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      {isLoading ? (
        <p className="mt-4 rounded-lg bg-neutral-50 p-8 text-center text-sm text-neutral-500" aria-live="polite">
          {t(locale, "calendar.loading")}
        </p>
      ) : (
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-1" aria-hidden="true">
            {weekdayLabels.map((label, i) => (
              <div key={i} className="py-1 text-center text-xs font-semibold text-neutral-500">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {days.map((day) => {
              const isStart = day.date === rangeStart;
              const isEnd = day.date === rangeEnd;
              const inRange =
                !!rangeStart && !!rangeEnd && day.date > rangeStart && day.date < rangeEnd;
              return (
                <DayCell
                  key={day.date}
                  day={day}
                  inRange={inRange}
                  isSelectedStart={isStart}
                  isSelectedEnd={isEnd}
                  label={
                    day.status === "occupied"
                      ? `${day.date} — ${t(locale, "calendar.occupied")}`
                      : day.status === "maintenance"
                        ? `${day.date} — ${t(locale, "calendar.maintenance")}`
                        : day.isPast
                          ? `${day.date} — ${t(locale, "calendar.past")}`
                          : `${day.date} — ${t(locale, "calendar.available")}`
                  }
                  onClick={() => handleDayClick(day.date)}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className={cn("flex flex-col gap-2")}>
        <AvailabilityLegend locale={locale} />
        {rangeStart && !rangeEnd && (
          <p className="text-xs text-brand-primary" aria-live="polite">
            {t(locale, "calendar.select_end")}
          </p>
        )}
        {rangeStart && rangeEnd && (
          <p className="text-xs text-neutral-600" aria-live="polite">
            {rangeStart} → {rangeEnd}
          </p>
        )}
      </div>
    </section>
  );
}

export default AvailabilityCalendar;
