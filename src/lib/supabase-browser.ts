// src/lib/supabase-browser.ts — Cliente Supabase para BROWSER (anon key)
// SDD: §4.2 — solo lectura pública de availability_blocks (RLS).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  cached = url && anonKey ? createClient(url, anonKey) : null;
  return cached;
}
