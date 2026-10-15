// src/pages/api/availability.ts — SDD §8.2
// Calendario de disponibilidad. Degradación graceful sin Supabase:
// responde todos los días "available" (bloques vacíos).
import type { APIRoute } from "astro";
import { availabilityQuerySchema } from "@/lib/validation";
import { getSupabaseServer } from "@/lib/supabase";
import { generateCalendarDays, type BlockRange } from "@/lib/availability";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const parsed = availabilityQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
  }
  const { vehicleId, year, month, months } = parsed.data;

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month - 1 + months, 0));

  let blocks: BlockRange[] = [];
  const supabase = getSupabaseServer();

  if (supabase) {
    const { data, error } = await supabase
      .from("availability_blocks")
      .select("start_date, end_date, type")
      .eq("vehicle_id", vehicleId)
      .lte("start_date", endDate.toISOString().split("T")[0])
      .gte("end_date", startDate.toISOString().split("T")[0])
      .order("start_date");

    if (error) {
      return new Response(JSON.stringify({ error: "DB error" }), { status: 500 });
    }
    blocks = (data ?? []) as BlockRange[];
  }

  const days = generateCalendarDays(year, month, months, blocks);

  return new Response(JSON.stringify({ days }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
  });
};
