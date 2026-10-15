// TDD RED→GREEN — EJ-09: lógica de disponibilidad (SDD §10.1)
// Comportamiento spec: tests/features/availability-calendar.feature
import { describe, it, expect } from "vitest";
import {
  generateCalendarDays,
  isRangeAvailable,
  findNextAvailable,
  type BlockRange,
} from "@/lib/availability";

describe("generateCalendarDays", () => {
  const reservation: BlockRange = {
    start_date: "2027-03-10",
    end_date: "2027-03-15",
    type: "RESERVATION",
  };
  const maintenance: BlockRange = {
    start_date: "2027-03-20",
    end_date: "2027-03-22",
    type: "MAINTENANCE",
  };

  it("generates every day of the month with available status (future month)", () => {
    const days = generateCalendarDays(2027, 3, 1, [], "America/Toronto", new Date("2027-01-01"));
    expect(days).toHaveLength(31);
    expect(days[0]).toMatchObject({ date: "2027-03-01", status: "available", isPast: false });
    expect(days[30].date).toBe("2027-03-31");
    expect(days.every((d) => d.status === "available")).toBe(true);
  });

  it("marks reserved and maintenance days with their block type", () => {
    const days = generateCalendarDays(
      2027,
      3,
      1,
      [reservation, maintenance],
      "America/Toronto",
      new Date("2027-01-01")
    );
    const mar12 = days.find((d) => d.date === "2027-03-12");
    expect(mar12?.status).toBe("occupied");
    expect(mar12?.blockType).toBe("RESERVATION");
    const mar21 = days.find((d) => d.date === "2027-03-21");
    expect(mar21?.status).toBe("maintenance");
    expect(mar21?.blockType).toBe("MAINTENANCE");
  });

  it("marks days before today as past", () => {
    const today = new Date("2027-03-15T00:00:00");
    const days = generateCalendarDays(2027, 3, 1, [reservation], "America/Toronto", today);
    expect(days.find((d) => d.date === "2027-03-14")?.status).toBe("past");
    expect(days.find((d) => d.date === "2027-03-14")?.isPast).toBe(true);
    expect(days.find((d) => d.date === "2027-03-15")?.isToday).toBe(true);
    // Hoy NO es pasado (seleccionable si está libre); aquí está reservado
    expect(days.find((d) => d.date === "2027-03-15")?.status).toBe("occupied");
  });

  it("spans multiple months when months > 1", () => {
    const days = generateCalendarDays(2027, 3, 2, [], "America/Toronto", new Date("2027-01-01"));
    expect(days[0].date).toBe("2027-03-01");
    expect(days[days.length - 1].date).toBe("2027-04-30");
  });

  it("handles blocks crossing month boundaries", () => {
    const crossing: BlockRange = {
      start_date: "2027-03-30",
      end_date: "2027-04-02",
      type: "BLOCKED",
    };
    const days = generateCalendarDays(2027, 4, 1, [crossing], "America/Toronto", new Date("2027-01-01"));
    expect(days.find((d) => d.date === "2027-04-01")?.status).toBe("occupied");
  });
});

describe("isRangeAvailable", () => {
  it("returns available when no conflicts", () => {
    const result = isRangeAvailable("2026-08-01", "2026-08-07", [
      { start_date: "2026-08-10", end_date: "2026-08-15", type: "RESERVATION" },
    ]);
    expect(result.available).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it("returns unavailable when range overlaps", () => {
    const result = isRangeAvailable("2026-08-05", "2026-08-12", [
      { start_date: "2026-08-10", end_date: "2026-08-15", type: "RESERVATION" },
    ]);
    expect(result.available).toBe(false);
    expect(result.conflicts).toHaveLength(1);
  });

  it("treats adjacent checkout/checkin dates as available", () => {
    // Rango termina el 9, el bloque empieza el 10 → sin conflicto
    const result = isRangeAvailable("2026-08-05", "2026-08-09", [
      { start_date: "2026-08-10", end_date: "2026-08-15", type: "RESERVATION" },
    ]);
    expect(result.available).toBe(true);
  });
});

describe("findNextAvailable", () => {
  it("returns day after block ends", () => {
    const result = findNextAvailable("2026-08-12", [
      { start_date: "2026-08-10", end_date: "2026-08-15", type: "RESERVATION" },
    ]);
    expect(result).toBe("2026-08-16");
  });

  it("returns the same date when there are no blocks", () => {
    expect(findNextAvailable("2026-09-01", [])).toBe("2026-09-01");
  });

  it("skips consecutive blocks", () => {
    const result = findNextAvailable("2026-08-12", [
      { start_date: "2026-08-10", end_date: "2026-08-15", type: "RESERVATION" },
      { start_date: "2026-08-16", end_date: "2026-08-20", type: "MAINTENANCE" },
    ]);
    expect(result).toBe("2026-08-21");
  });
});
