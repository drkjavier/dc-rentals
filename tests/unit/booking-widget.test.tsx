// @vitest-environment jsdom
// TDD — EJ-15: widget de reserva (island) — tests/features/reservation-request.feature
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { BookingWidget } from "@/components/booking/booking-widget";
import { useBookingStore } from "@/stores/booking-store";

const vehicle = {
  internalCode: "DC-C3-001",
  name: "2024 Jayco Redhawk 26B",
  pricePerNightCAD: 189,
  securityDepositCAD: 1000,
  status: "AVAILABLE",
};

describe("BookingWidget", () => {
  beforeEach(() => {
    useBookingStore.getState().reset();
    vi.restoreAllMocks();
  });

  it("shows the date hint when no dates are selected", () => {
    render(<BookingWidget locale="en" vehicle={vehicle} />);
    expect(screen.getByText(/Select your dates/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Request Reservation/i })).toBeDisabled();
  });

  it("renders the live price breakdown once dates are set", () => {
    useBookingStore.getState().setDates("2027-05-10", "2027-05-15");
    render(<BookingWidget locale="en" vehicle={vehicle} />);
    expect(screen.getByText(/Base rate × 5 nights/)).toBeInTheDocument();
    expect(screen.getByText(/Insurance × 5 days/)).toBeInTheDocument();
    expect(screen.getByText(/Estimated total/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Request Reservation/i })).toBeEnabled();
  });

  it("submits a reservation request and shows success (happy path)", async () => {
    useBookingStore.getState().setDates("2027-05-10", "2027-05-15");
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ success: true, reservationId: "req-1", status: "PENDING" }),
        { status: 201 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<BookingWidget locale="en" vehicle={vehicle} />);
    await userEvent.type(screen.getByLabelText(/Full name/), "Jane Traveller");
    await userEvent.type(screen.getByLabelText(/Email/), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/Driver's age/), "35");
    await userEvent.click(screen.getByRole("button", { name: /Request Reservation/i }));

    await waitFor(() => {
      expect(screen.getByText(/Request received/i)).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const payload = JSON.parse(String(init.body));
    expect(payload.vehicleId).toBe("DC-C3-001");
    expect(payload.startDate).toBe("2027-05-10");
    expect(payload.driverAge).toBe(35);
  });

  it("shows the date-conflict error on 409 (sad path)", async () => {
    useBookingStore.getState().setDates("2027-05-10", "2027-05-15");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "DATE_CONFLICT" }), { status: 409 })
      )
    );

    render(<BookingWidget locale="en" vehicle={vehicle} />);
    await userEvent.type(screen.getByLabelText(/Full name/), "Jane Traveller");
    await userEvent.type(screen.getByLabelText(/Email/), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/Driver's age/), "35");
    await userEvent.click(screen.getByRole("button", { name: /Request Reservation/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/just taken/i);
    });
  });

  it("shows the graceful error on 503 (no Supabase configured)", async () => {
    useBookingStore.getState().setDates("2027-05-10", "2027-05-15");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "DATABASE_NOT_CONFIGURED" }), { status: 503 })
      )
    );

    render(<BookingWidget locale="en" vehicle={vehicle} />);
    await userEvent.type(screen.getByLabelText(/Full name/), "Jane Traveller");
    await userEvent.type(screen.getByLabelText(/Email/), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/Driver's age/), "35");
    await userEvent.click(screen.getByRole("button", { name: /Request Reservation/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/contact us by phone/i);
    });
  });
});
