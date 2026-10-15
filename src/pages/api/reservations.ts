// src/pages/api/reservations.ts — SDD §8.4 y §12.1
// Solicitud de reserva SIN PAGO (ADR-011): validar → verificar disponibilidad →
// congelar precio → insertar PENDING → emails opcionales (Resend).
import type { APIRoute } from "astro";
import { reservationRequestSchema } from "@/lib/validation";
import { getSupabaseServer } from "@/lib/supabase";
import { calculatePrice } from "@/lib/pricing";
import { getVehicleByCode } from "@/lib/content";
import { sendReservationRequestEmails } from "@/lib/email";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = reservationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
  }
  const input = parsed.data;

  // 0. Base de datos configurada? (degradación graceful en MVP sin Supabase)
  const supabase = getSupabaseServer();
  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: "DATABASE_NOT_CONFIGURED",
        message:
          "Reservations are temporarily unavailable. Please contact us by phone or try again later.",
      }),
      { status: 503 }
    );
  }

  // 1. Verificar que el vehículo existe en el catálogo
  const vehicle = await getVehicleByCode(input.vehicleId);
  if (!vehicle) {
    return new Response(JSON.stringify({ error: "Vehicle not found" }), { status: 404 });
  }

  // 2. Verificar disponibilidad (doble check server-side)
  const { data: conflicts } = await supabase
    .from("availability_blocks")
    .select("id")
    .eq("vehicle_id", input.vehicleId)
    .lte("start_date", input.endDate)
    .gte("end_date", input.startDate);

  if ((conflicts ?? []).length > 0) {
    return new Response(
      JSON.stringify({ error: "DATE_CONFLICT", message: "Selected dates are no longer available" }),
      { status: 409 }
    );
  }

  // 3. Calcular precio y congelarlo en el snapshot (misma función pura que el island)
  const priceSnapshot = calculatePrice({
    nightlyRateCAD: vehicle.pricePerNightCAD,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
    province: input.guestProvince ?? "AB",
    kmPackageId: input.kmPackage,
    extras: input.extras,
    securityDepositCAD: vehicle.securityDepositCAD,
  });

  // 4. Crear solicitud con status PENDING (sin pago)
  const { data: reservation, error } = await supabase
    .from("reservation_requests")
    .insert({
      vehicle_id: input.vehicleId,
      start_date: input.startDate,
      end_date: input.endDate,
      nights: priceSnapshot.nights,
      km_package: input.kmPackage ?? null,
      extras: JSON.stringify(input.extras ?? []),
      delivery_address: input.deliveryAddress ?? null,
      price_snapshot: JSON.stringify(priceSnapshot),
      status: "PENDING",
      guest_name: input.guestName,
      guest_email: input.guestEmail,
      guest_phone: input.guestPhone ?? null,
      guest_province: input.guestProvince ?? null,
      license_type: input.licenseType ?? null,
      driver_age: input.driverAge,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error || !reservation) {
    return new Response(JSON.stringify({ error: "Could not create request" }), { status: 500 });
  }

  // 5. Emails de acuse (opcional: si RESEND_API_KEY está vacío, solo registro en BD)
  await sendReservationRequestEmails(reservation);

  return new Response(
    JSON.stringify({
      success: true,
      reservationId: reservation.id,
      status: "PENDING",
      message: "Reservation request received. We will confirm within 24 hours.",
    }),
    { status: 201 }
  );
};
