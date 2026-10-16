// src/pages/api/admin/vehicles.ts — ADR-020 + ADR-022
// GET: lista resumida de trucks (code, name, type, status, active, slug).
// POST: crea un truck validado con vehicleSchema en vehicles_catalog.
// En éxito dispara el Deploy Hook de Vercel y responde deploy=triggered|skipped.
import type { APIRoute } from "astro";
import { requireAdmin, json, databaseNotConfigured } from "@/lib/admin/guard";
import { listVehicles, getVehicleByCode, upsertVehicle } from "@/lib/admin/catalog-db";
import { triggerDeployHook } from "@/lib/admin/deploy";
import { vehicleSchema } from "@/lib/content-schemas";
import { isSupabaseConfigured } from "@/lib/supabase";

export const prerender = false;

/** dc-c3-001.json (kebab-case del internalCode) — shape legacy del panel */
export function vehicleFileName(internalCode: string): string {
  return `${internalCode.toLowerCase()}.json`;
}

export const GET: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;
  if (!isSupabaseConfigured()) return databaseNotConfigured();

  const vehicles = await listVehicles();
  if (!vehicles) {
    return json(
      { error: "DATABASE_ERROR", message: "No se pudo leer vehicles_catalog." },
      500
    );
  }
  return json({
    vehicles: vehicles.map((v) => ({
      internalCode: v.internalCode,
      name: v.name,
      type: v.type,
      status: v.status,
      active: v.active,
      featured: v.featured,
      slug: v.slug,
      pricePerNightCAD: v.pricePerNightCAD,
      fileName: vehicleFileName(v.internalCode),
    })),
  });
};

export const POST: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;
  if (!isSupabaseConfigured()) return databaseNotConfigured();

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "JSON inválido en el cuerpo" }, 400);
  }

  const parsed = vehicleSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { error: "VALIDATION_FAILED", details: parsed.error.flatten() },
      400
    );
  }

  // No pisar un truck existente: el cliente debe usar PUT para editar
  const existing = await getVehicleByCode(parsed.data.internalCode);
  if (existing) {
    return json(
      {
        error: "ALREADY_EXISTS",
        message: `Ya existe un truck con código ${parsed.data.internalCode}. Usa PUT para editar.`,
      },
      409
    );
  }

  const saved = await upsertVehicle(parsed.data);
  if (!saved) {
    return json(
      { error: "WRITE_FAILED", message: "No se pudo guardar el truck en vehicles_catalog." },
      500
    );
  }

  const { triggered } = await triggerDeployHook(
    `content(vehicles): add ${parsed.data.internalCode} — ${parsed.data.name}`
  );
  return json({ ok: true, deploy: triggered ? "triggered" : "skipped" }, 201);
};
