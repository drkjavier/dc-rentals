// src/lib/validation.ts — Schemas Zod compartidos entre endpoints e islands
// SDD: TECHNICAL-SPEC.md §8 (validación de contratos)
import { z } from "zod";

/** GET /api/availability — query params */
export const availabilityQuerySchema = z.object({
  vehicleId: z.string().min(1), // internalCode, ej. "DC-C3-001"
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
  months: z.coerce.number().min(1).max(3).default(2),
});

/** GET /api/availability-check — query params */
export const availabilityCheckQuerySchema = z.object({
  vehicleId: z.string().min(1),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** POST /api/reservations — body (SDD §8.4, sin pago — ADR-011) */
export const reservationRequestSchema = z
  .object({
    vehicleId: z.string().min(1),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guestName: z.string().min(2).max(100),
    guestEmail: z.string().email(),
    guestPhone: z.string().max(20).optional(),
    guestProvince: z.string().max(50).optional(),
    licenseType: z.string().max(20).optional(),
    driverAge: z.number().int().min(21).max(99),
    kmPackage: z.enum(["basic", "standard", "unlimited"]).optional(),
    extras: z
      .array(
        z.object({
          id: z.string(),
          quantity: z.number().int().min(1),
        })
      )
      .optional(),
    deliveryAddress: z.string().max(300).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type AvailabilityCheckQuery = z.infer<typeof availabilityCheckQuerySchema>;
export type ReservationRequest = z.infer<typeof reservationRequestSchema>;
