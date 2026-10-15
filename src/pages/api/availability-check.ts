// src/pages/api/availability-check.ts — SDD §8.3
// Verificación de un rango concreto (no-store para consistencia al reservar).
import type { APIRoute } from "astro";
import { availabilityCheckQuerySchema } from "@/lib/validation";
import { getSupabaseServer } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const parsed = availabilityCheckQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid params" }), { status: 400 });
  }
  const { vehicleId, start, end } = parsed.data;

  const supabase = getSupabaseServer();
  let conflicts: unknown[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("availability_blocks")
      .select("start_date, end_date, type")
      .eq("vehicle_id", vehicleId)
      .lte("start_date", end)
      .gte("end_date", start);
    conflicts = data ?? [];
  }

  return new Response(JSON.stringify({ available: conflicts.length === 0, conflicts }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};
