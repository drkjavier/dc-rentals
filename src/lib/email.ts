// src/lib/email.ts — Notificaciones por email (Resend, opcional en MVP)
// SDD: §8.4 paso 5 y §12.1 — si RESEND_API_KEY está vacío, solo se registra
// la solicitud en BD (degradación graceful sin fallo).

interface ReservationEmailPayload {
  id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  guest_name: string;
  guest_email: string;
  price_snapshot: unknown;
}

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendReservationRequestEmails(
  reservation: ReservationEmailPayload
): Promise<{ sent: boolean }> {
  const apiKey = import.meta.env.RESEND_API_KEY as string | undefined;
  const from = (import.meta.env.EMAIL_FROM as string | undefined) ?? "bookings@dc-rentals.ca";
  const notifyTo = (import.meta.env.EMAIL_NOTIFY_TO as string | undefined) ?? from;

  if (!apiKey) {
    // Sin API key: el registro en Supabase es suficiente (MVP)
    console.warn(
      `[email] RESEND_API_KEY no configurado — solicitud ${reservation.id} registrada solo en BD`
    );
    return { sent: false };
  }

  try {
    await Promise.all([
      fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [reservation.guest_email],
          subject: `DC Rentals — reservation request received (${reservation.id})`,
          html: `
            <h1>Thank you, ${reservation.guest_name}!</h1>
            <p>We received your reservation request for <strong>${reservation.vehicle_id}</strong>
            from <strong>${reservation.start_date}</strong> to <strong>${reservation.end_date}</strong>.</p>
            <p>We will confirm availability within 24 hours. No payment is required at this time.</p>
            <p>Reference: ${reservation.id}</p>`,
        }),
      }),
      fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [notifyTo],
          subject: `🔔 New reservation request ${reservation.id} (${reservation.vehicle_id})`,
          html: `
            <h2>New reservation request</h2>
            <ul>
              <li><strong>Vehicle:</strong> ${reservation.vehicle_id}</li>
              <li><strong>Dates:</strong> ${reservation.start_date} → ${reservation.end_date}</li>
              <li><strong>Guest:</strong> ${reservation.guest_name} (${reservation.guest_email})</li>
              <li><strong>Request ID:</strong> ${reservation.id}</li>
            </ul>
            <p>Confirm from the Supabase dashboard (status → CONFIRMED + insert availability_block).</p>`,
        }),
      }),
    ]);
    return { sent: true };
  } catch (error) {
    console.error("[email] Failed to send reservation emails", error);
    return { sent: false };
  }
}
