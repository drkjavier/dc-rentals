// src/lib/supabase.ts — Cliente Supabase de SERVER (service role)
// SDD: TECHNICAL-SPEC.md §4.2 — la service role key NUNCA se expone al browser.
// Degradación graceful (decisión operativa): si faltan las env vars, devuelve
// null y los endpoints responden 503 DATABASE_NOT_CONFIGURED (o disponibilidad
// vacía en lecturas) sin romper el sitio.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabaseServer(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  cached =
    url && serviceKey
      ? createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseServer() !== null;
}

/** Para tests: resetea la caché del cliente */
export function resetSupabaseCache(): void {
  cached = undefined;
}
