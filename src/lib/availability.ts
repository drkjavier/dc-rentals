// src/lib/availability.ts — Lógica de disponibilidad (funciones puras)
// SDD: TECHNICAL-SPEC.md §10.1 — fechas como strings "YYYY-MM-DD" para
// evitar problemas de timezone en comparaciones.
// Nota operativa: se añade el parámetro opcional `today` para hacer la
// función determinista en tests (misma semántica que new Date() en runtime).

export type DayStatus = "available" | "occupied" | "maintenance" | "past";

export interface BlockRange {
  start_date: string; // "2026-08-10"
  end_date: string; // "2026-08-15"
  type: "RESERVATION" | "MAINTENANCE" | "BLOCKED" | "COMING_SOON";
}

export interface CalendarDay {
  date: string; // "2026-08-15"
  status: DayStatus;
  blockType?: string;
  isPast: boolean;
  isToday: boolean;
}

const fmt = (d: Date): string => d.toISOString().split("T")[0];

export function generateCalendarDays(
  year: number,
  month: number,
  months: number,
  blocks: BlockRange[],
  _timezone = "America/Toronto",
  today: Date = new Date()
): CalendarDay[] {
  const todayStr = fmt(today);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month - 1 + months, 0));

  const days: CalendarDay[] = [];
  const current = new Date(firstDay);

  while (current <= lastDay) {
    const dateStr = fmt(current);
    const isPast = dateStr < todayStr;
    const isToday = dateStr === todayStr;

    const block = blocks.find((b) => dateStr >= b.start_date && dateStr <= b.end_date);

    let status: DayStatus;
    if (isPast) status = "past";
    else if (block) status = block.type === "MAINTENANCE" ? "maintenance" : "occupied";
    else status = "available";

    days.push({ date: dateStr, status, blockType: block?.type, isPast, isToday });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}

/**
 * Verifica si un rango de fechas está completamente disponible
 */
export function isRangeAvailable(
  startDate: string,
  endDate: string,
  blocks: BlockRange[]
): { available: boolean; conflicts: BlockRange[] } {
  const conflicts = blocks.filter((b) => startDate <= b.end_date && endDate >= b.start_date);
  return { available: conflicts.length === 0, conflicts };
}

/**
 * Encuentra la próxima fecha disponible después de una fecha dada,
 * saltando bloques consecutivos/solapados.
 */
export function findNextAvailable(afterDate: string, blocks: BlockRange[]): string {
  const sorted = [...blocks].sort((a, b) => a.start_date.localeCompare(b.start_date));
  let searchDate = afterDate;
  let moved = true;

  while (moved) {
    moved = false;
    for (const block of sorted) {
      if (searchDate >= block.start_date && searchDate <= block.end_date) {
        const d = new Date(`${block.end_date}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() + 1);
        searchDate = d.toISOString().split("T")[0];
        moved = true;
      }
    }
  }
  return searchDate;
}
