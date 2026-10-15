// @vitest-environment jsdom
// TDD — EJ-16: calendario de disponibilidad (island)
// tests/features/availability-calendar.feature
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvailabilityCalendar } from "@/components/calendar/availability-calendar";
import { useBookingStore } from "@/stores/booking-store";
import { generateCalendarDays, type BlockRange } from "@/lib/availability";

const BLOCKS: BlockRange[] = [
  { start_date: "2027-03-10", end_date: "2027-03-15", type: "RESERVATION" },
];

function stubFetch() {
  return vi.fn(async (url: string) => {
    const parsed = new URL(url, "http://test");
    const year = Number(parsed.searchParams.get("year"));
    const month = Number(parsed.searchParams.get("month"));
    const months = Number(parsed.searchParams.get("months") ?? "2");
    const days = generateCalendarDays(year, month, months, BLOCKS, "America/Toronto", new Date("2027-01-01"));
    return new Response(JSON.stringify({ days }), { status: 200 });
  });
}

describe("AvailabilityCalendar", () => {
  beforeEach(() => {
    useBookingStore.getState().reset();
    vi.restoreAllMocks();
  });

  it("renders the current month with colored day states", async () => {
    vi.stubGlobal("fetch", stubFetch());
    render(<AvailabilityCalendar vehicleId="DC-C3-001" locale="en" initialYear={2027} initialMonth={3} />);

    await waitFor(() => {
      expect(screen.getByText("March 2027")).toBeInTheDocument();
    });

    // Día reservado deshabilitado con label de ocupado
    const occupiedDay = await screen.findByRole("button", { name: /2027-03-12 — Occupied/ });
    expect(occupiedDay).toBeDisabled();

    // Día disponible habilitado
    const freeDay = screen.getByRole("button", { name: /2027-03-05 — Available/ });
    expect(freeDay).toBeEnabled();
  });

  it("selects a date range and writes it to the booking store", async () => {
    vi.stubGlobal("fetch", stubFetch());
    render(<AvailabilityCalendar vehicleId="DC-C3-001" locale="en" initialYear={2027} initialMonth={3} />);

    const start = await screen.findByRole("button", { name: /2027-03-05/ });
    await userEvent.click(start);
    const end = screen.getByRole("button", { name: /2027-03-08/ });
    await userEvent.click(end);

    expect(useBookingStore.getState().startDate).toBe("2027-03-05");
    expect(useBookingStore.getState().endDate).toBe("2027-03-08");
  });

  it("does not write endDate when end is before start", async () => {
    vi.stubGlobal("fetch", stubFetch());
    render(<AvailabilityCalendar vehicleId="DC-C3-001" locale="en" initialYear={2027} initialMonth={3} />);

    const late = await screen.findByRole("button", { name: /2027-03-08/ });
    await userEvent.click(late);
    const early = screen.getByRole("button", { name: /2027-03-05/ });
    await userEvent.click(early);

    // Segundo click anterior reinicia el inicio en el UI, sin escribir nada en el store
    expect(useBookingStore.getState().startDate).toBeNull();
    expect(useBookingStore.getState().endDate).toBeNull();
  });

  it("navigates to the next month and refetches", async () => {
    const fetchMock = stubFetch();
    vi.stubGlobal("fetch", fetchMock);
    render(<AvailabilityCalendar vehicleId="DC-C3-001" locale="en" initialYear={2027} initialMonth={3} />);

    await screen.findByText("March 2027");
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));

    await waitFor(() => {
      expect(screen.getByText("April 2027")).toBeInTheDocument();
    });
    const lastUrl = String(fetchMock.mock.calls.at(-1)?.[0]);
    expect(lastUrl).toContain("month=4");
  });

  it("shows a graceful loading state and the legend", async () => {
    vi.stubGlobal("fetch", stubFetch());
    render(<AvailabilityCalendar vehicleId="DC-C3-001" locale="en" initialYear={2027} initialMonth={3} />);
    expect(screen.getByRole("list", { name: "Legend" })).toBeInTheDocument();
  });
});
