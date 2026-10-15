// src/components/calendar/day-cell.tsx — Celda individual del calendario
import type { CalendarDay } from "@/lib/availability";
import { cn } from "@/lib/utils";

interface DayCellProps {
  day: CalendarDay;
  inRange: boolean;
  isSelectedStart: boolean;
  isSelectedEnd: boolean;
  label: string;
  onClick: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  available: "bg-status-available/10 text-neutral-800 hover:bg-status-available/25",
  occupied: "bg-status-occupied/15 text-status-occupied line-through",
  maintenance: "bg-status-maintenance/15 text-status-maintenance",
  past: "bg-neutral-50 text-neutral-300",
};

export function DayCell({
  day,
  inRange,
  isSelectedStart,
  isSelectedEnd,
  label,
  onClick,
}: DayCellProps) {
  const disabled = day.status !== "available" || day.isPast;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={inRange || isSelectedStart}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors duration-150",
        STATUS_STYLES[day.status],
        (inRange || isSelectedStart || isSelectedEnd) && "ring-2 ring-brand-primary",
        !disabled && "cursor-pointer",
        "focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
      )}
    >
      {Number(day.date.slice(8, 10))}
    </button>
  );
}

export default DayCell;
