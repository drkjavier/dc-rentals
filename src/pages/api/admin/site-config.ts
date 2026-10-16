// src/pages/api/admin/site-config.ts — ADR-020 + ADR-022
// GET: devuelve el config actual (singleton site_config en Supabase).
// PUT: valida con Zod y hace upsert del singleton.
import type { APIRoute } from "astro";
import { requireAdmin, json, databaseNotConfigured } from "@/lib/admin/guard";
import { getSiteConfigRow, putSiteConfig } from "@/lib/admin/catalog-db";
import { triggerDeployHook } from "@/lib/admin/deploy";
import { siteConfigSchema } from "@/lib/site-config";
import { isSupabaseConfigured } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;
  if (!isSupabaseConfigured()) return databaseNotConfigured();

  const config = await getSiteConfigRow();
  if (!config) {
    return json(
      { error: "No hay site_config en la base de datos (o es inválido)." },
      404
    );
  }
  return json({ config });
};

export const PUT: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;
  if (!isSupabaseConfigured()) return databaseNotConfigured();

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "JSON inválido en el cuerpo" }, 400);
  }

  const parsed = siteConfigSchema.safeParse(body);
  if (!parsed.success) {
    // 400 con errores de Zod — NO se escribe nada
    return json(
      { error: "VALIDATION_FAILED", details: parsed.error.flatten() },
      400
    );
  }

  const saved = await putSiteConfig(parsed.data);
  if (!saved) {
    return json(
      { error: "WRITE_FAILED", message: "No se pudo guardar el config en site_config." },
      500
    );
  }

  const { triggered } = await triggerDeployHook(
    "chore(site): update site config (logo/hero/branding)"
  );
  return json({ ok: true, deploy: triggered ? "triggered" : "skipped" });
};
