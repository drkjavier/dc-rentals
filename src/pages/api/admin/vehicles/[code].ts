// src/pages/api/admin/vehicles/[code].ts — ADR-020 + ADR-022
// GET: devuelve un truck completo para editar en el formulario.
// PUT: valida con vehicleSchema y hace upsert en vehicles_catalog.
// DELETE no está soportado: se oculta con active=false (sin perder historial).
import type { APIRoute } from "astro";
import { requireAdmin, json, databaseNotConfigured } from "@/lib/admin/guard";
import { getVehicleByCode, upsertVehicle } from "@/lib/admin/catalog-db";
import { triggerDeployHook } from "@/lib/admin/deploy";
import { vehicleSchema } from "@/lib/content-schemas";
import { isSupabaseConfigured } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;
  if (!isSupabaseConfigured()) return databaseNotConfigured();

  const code = context.params.code!;
  const vehicle = await getVehicleByCode(code);
  if (!vehicle) {
    return json({ error: `No existe ningún truck con código ${code}` }, 404);
  }
  return json({ vehicle });
};

export const PUT: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;
  if (!isSupabaseConfigured()) return databaseNotConfigured();

  const code = context.params.code!.toLowerCase();
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

  // El internalCode del payload debe coincidir con el código de la URL
  // (evita renombres accidentales que romperían enlaces existentes)
  if (parsed.data.internalCode.toLowerCase() !== code) {
    return json(
      {
        error: "CODE_MISMATCH",
        message: `El internalCode ${parsed.data.internalCode} no coincide con el código ${code} de la URL.`,
      },
      400
    );
  }

  const existing = await getVehicleByCode(code);
  if (!existing) {
    return json({ error: `No existe ningún truck con código ${code}` }, 404);
  }

  const saved = await upsertVehicle(parsed.data);
  if (!saved) {
    return json(
      { error: "WRITE_FAILED", message: "No se pudo actualizar el truck en vehicles_catalog." },
      500
    );
  }

  const { triggered } = await triggerDeployHook(
    `content(vehicles): update ${parsed.data.internalCode} — ${parsed.data.name}`
  );
  return json({ ok: true, deploy: triggered ? "triggered" : "skipped" });
};

export const DELETE: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;

  // Borrado físico NO soportado a propósito (ADR-020): el flujo correcto es
  // poner active=false para ocultar el truck sin perder historial/enlaces.
  return json(
    {
      error: "DELETE_NOT_SUPPORTED",
      message:
        "No se borran trucks: edita el truck y pon active=false para ocultarlo del catálogo.",
    },
    405
  );
};
