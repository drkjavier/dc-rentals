// src/pages/api/admin/vehicles/[code].ts — ADR-020
// GET: devuelve un truck completo para editar en el formulario.
// PUT: valida con vehicleSchema y commitea los cambios.
import type { APIRoute } from "astro";
import { requireAdmin, json } from "@/lib/admin/guard";
import { getFile, putFile } from "@/lib/admin/github";
import { vehicleSchema } from "@/lib/content-schemas";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;

  const code = context.params.code!.toLowerCase();
  const file = await getFile(guard.github, `src/content/vehicles/${code}.json`);
  if (!file.ok) return json({ error: file.error }, file.status);
  return json({ vehicle: JSON.parse(file.data) });
};

export const PUT: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;

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

  // El internalCode del payload debe coincidir con el archivo (evita renombres
  // accidentales que romperían enlaces existentes)
  if (parsed.data.internalCode.toLowerCase() !== code) {
    return json(
      {
        error: "CODE_MISMATCH",
        message: `El internalCode ${parsed.data.internalCode} no coincide con el archivo ${code}.json`,
      },
      400
    );
  }

  const existing = await getFile(guard.github, `src/content/vehicles/${code}.json`);
  if (!existing.ok) return json({ error: existing.error }, existing.status);

  const content = `${JSON.stringify(parsed.data, null, 2)}\n`;
  const result = await putFile(
    guard.github,
    `src/content/vehicles/${code}.json`,
    content,
    `content(vehicles): update ${parsed.data.internalCode} — ${parsed.data.name}`,
    undefined // el sha se resuelve internamente vía 409-retry
  );
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ ok: true, commitSha: result.data.commitSha });
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
