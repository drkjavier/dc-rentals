// TDD — EJ-11: tests de contrato de los endpoints (SDD §8)
// Comportamiento spec: tests/features/reservation-request.feature +
// tests/features/availability-calendar.feature
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────
const supabaseState = vi.hoisted(() => ({
  server: null as any,
  tableResults: new Map<string, { data: any; error: any }>(),
  inserts: [] as any[],
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: () => supabaseState.server,
  isSupabaseConfigured: () => supabaseState.server !== null,
}));

const contentState = vi.hoisted(() => ({
  vehicle: null as any,
}));

vi.mock("@/lib/content", () => ({
  getVehicleByCode: vi.fn(async () => contentState.vehicle),
  getVehiclesForApi: vi.fn(async () => [
    { internalCode: "DC-C3-001", name: "2024 Jayco Redhawk 26B", pricePerNightCAD: 189 },
  ]),
}));

const emailMock = vi.hoisted(() => ({ send: vi.fn(async () => ({ sent: false })) }));

vi.mock("@/lib/email", () => ({
  sendReservationRequestEmails: emailMock.send,
}));

import { GET as vehiclesJsonGET } from "@/pages/api/vehicles.json";
import { GET as availabilityGET } from "@/pages/api/availability";
import { GET as availabilityCheckGET } from "@/pages/api/availability-check";
import { POST as reservationsPOST } from "@/pages/api/reservations";

// ─── Helpers ──────────────────────────────────────────────
function chain(result: { data: any; error: any }) {
  const q: any = {
    select: () => q,
    eq: () => q,
    lte: () => q,
    gte: () => q,
    order: () => q,
    insert: (payload: any) => {
      supabaseState.inserts.push(payload);
      return q;
    },
    single: () => q,
    then: (onFulfilled: any, onRejected: any) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return q;
}

function makeSupabase(tables: Record<string, { data: any; error: any }>) {
  return {
    from: (table: string) => chain(tables[table] ?? { data: [], error: null }),
  };
}

function makeRequest(url: string, init?: RequestInit): Request {
  return new Request(url, init);
}

const vehicleStub = {
  internalCode: "DC-C3-001",
  pricePerNightCAD: 189,
  securityDepositCAD: 1000,
};

beforeEach(() => {
  supabaseState.server = null;
  supabaseState.tableResults.clear();
  supabaseState.inserts = [];
  contentState.vehicle = vehicleStub;
  emailMock.send.mockClear();
});

// ─── GET /api/vehicles.json ───────────────────────────────
describe("GET /api/vehicles.json", () => {
  it("returns the catalog with cache headers", async () => {
    const res = await vehiclesJsonGET({} as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].internalCode).toBe("DC-C3-001");
  });
});

// ─── GET /api/availability ────────────────────────────────
describe("GET /api/availability", () => {
  it("responds 400 on invalid params (month out of range)", async () => {
    const url = new URL("http://test/api/availability?vehicleId=DC-C3-001&year=2026&month=13");
    const res = await availabilityGET({ url } as any);
    expect(res.status).toBe(400);
  });

  it("responds 400 on missing vehicleId", async () => {
    const url = new URL("http://test/api/availability?year=2026&month=8");
    const res = await availabilityGET({ url } as any);
    expect(res.status).toBe(400);
  });

  it("degrades gracefully without Supabase: all days available", async () => {
    supabaseState.server = null;
    const url = new URL("http://test/api/availability?vehicleId=DC-C3-001&year=2027&month=3&months=1");
    const res = await availabilityGET({ url } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.days).toHaveLength(31);
    expect(body.days.every((d: any) => d.status === "available")).toBe(true);
  });

  it("marks blocked days as occupied when Supabase returns blocks", async () => {
    supabaseState.server = makeSupabase({
      availability_blocks: {
        data: [{ start_date: "2027-03-10", end_date: "2027-03-15", type: "RESERVATION" }],
        error: null,
      },
    });
    const url = new URL("http://test/api/availability?vehicleId=DC-C3-001&year=2027&month=3&months=1");
    const res = await availabilityGET({ url } as any);
    const body = await res.json();
    const mar12 = body.days.find((d: any) => d.date === "2027-03-12");
    expect(mar12.status).toBe("occupied");
  });
});

// ─── GET /api/availability-check ──────────────────────────
describe("GET /api/availability-check", () => {
  it("responds 400 on invalid date format", async () => {
    const url = new URL("http://test/api/availability-check?vehicleId=DC-C3-001&start=bad&end=2026-08-10");
    const res = await availabilityCheckGET({ url } as any);
    expect(res.status).toBe(400);
  });

  it("returns available:true without Supabase (graceful)", async () => {
    const url = new URL("http://test/api/availability-check?vehicleId=DC-C3-001&start=2026-08-01&end=2026-08-07");
    const res = await availabilityCheckGET({ url } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(true);
  });

  it("returns conflicts from Supabase", async () => {
    supabaseState.server = makeSupabase({
      availability_blocks: {
        data: [{ start_date: "2026-08-05", end_date: "2026-08-10", type: "RESERVATION" }],
        error: null,
      },
    });
    const url = new URL("http://test/api/availability-check?vehicleId=DC-C3-001&start=2026-08-01&end=2026-08-07");
    const res = await availabilityCheckGET({ url } as any);
    const body = await res.json();
    expect(body.available).toBe(false);
    expect(body.conflicts).toHaveLength(1);
  });
});

// ─── POST /api/reservations ───────────────────────────────
function reservationBody(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    vehicleId: "DC-C3-001",
    startDate: "2027-05-10",
    endDate: "2027-05-15",
    guestName: "Jane Traveller",
    guestEmail: "jane@example.com",
    driverAge: 35,
    guestProvince: "AB",
    kmPackage: "standard",
    ...overrides,
  });
}

describe("POST /api/reservations", () => {
  it("responds 400 on invalid email", async () => {
    const req = makeRequest("http://test/api/reservations", {
      method: "POST",
      body: reservationBody({ guestEmail: "no-es-email" }),
    });
    const res = await reservationsPOST({ request: req } as any);
    expect(res.status).toBe(400);
  });

  it("responds 400 when driver is under 21", async () => {
    const req = makeRequest("http://test/api/reservations", {
      method: "POST",
      body: reservationBody({ driverAge: 18 }),
    });
    const res = await reservationsPOST({ request: req } as any);
    expect(res.status).toBe(400);
  });

  it("responds 400 when endDate is not after startDate", async () => {
    const req = makeRequest("http://test/api/reservations", {
      method: "POST",
      body: reservationBody({ endDate: "2027-05-10" }),
    });
    const res = await reservationsPOST({ request: req } as any);
    expect(res.status).toBe(400);
  });

  it("responds 503 DATABASE_NOT_CONFIGURED without Supabase", async () => {
    supabaseState.server = null;
    const req = makeRequest("http://test/api/reservations", {
      method: "POST",
      body: reservationBody(),
    });
    const res = await reservationsPOST({ request: req } as any);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("DATABASE_NOT_CONFIGURED");
  });

  it("responds 404 for unknown vehicle", async () => {
    supabaseState.server = makeSupabase({});
    contentState.vehicle = null;
    const req = makeRequest("http://test/api/reservations", {
      method: "POST",
      body: reservationBody(),
    });
    const res = await reservationsPOST({ request: req } as any);
    expect(res.status).toBe(404);
  });

  it("responds 409 DATE_CONFLICT when the range is blocked, without inserting", async () => {
    supabaseState.server = makeSupabase({
      availability_blocks: { data: [{ id: "block-1" }], error: null },
    });
    const req = makeRequest("http://test/api/reservations", {
      method: "POST",
      body: reservationBody(),
    });
    const res = await reservationsPOST({ request: req } as any);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("DATE_CONFLICT");
    expect(supabaseState.inserts).toHaveLength(0);
  });

  it("happy path: creates a PENDING request with frozen price snapshot", async () => {
    supabaseState.server = makeSupabase({
      availability_blocks: { data: [], error: null },
      reservation_requests: { data: { id: "req-123", status: "PENDING" }, error: null },
    });
    const req = makeRequest("http://test/api/reservations", {
      method: "POST",
      body: reservationBody(),
    });
    const res = await reservationsPOST({ request: req } as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.reservationId).toBe("req-123");
    expect(body.status).toBe("PENDING");

    const insert = supabaseState.inserts[0];
    expect(insert.vehicle_id).toBe("DC-C3-001");
    expect(insert.status).toBe("PENDING");
    expect(insert.nights).toBe(5);
    const snapshot = JSON.parse(insert.price_snapshot);
    expect(snapshot.nights).toBe(5);
    expect(snapshot.baseRateCAD).toBe(945);
    expect(snapshot.kmPackage.priceCAD).toBe(300);
    expect(snapshot.taxRate).toBe(0.05);
    expect(snapshot.totalCAD).toBeGreaterThan(0);

    expect(emailMock.send).toHaveBeenCalledTimes(1);
  });

  it("responds 500 when the insert fails", async () => {
    supabaseState.server = makeSupabase({
      availability_blocks: { data: [], error: null },
      reservation_requests: { data: null, error: { message: "boom" } },
    });
    const req = makeRequest("http://test/api/reservations", {
      method: "POST",
      body: reservationBody(),
    });
    const res = await reservationsPOST({ request: req } as any);
    expect(res.status).toBe(500);
  });
});
