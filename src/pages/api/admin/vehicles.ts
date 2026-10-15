// src/pages/api/admin/vehicles.ts — ADR-020
// GET: lista resumida de trucks (code, name, type, status, active, slug).
// POST: crea src/content/vehicles/<code>.json validado con vehicleSchema.
import type { APIRoute } from "astro";
import { requireAdmin, json } from "@/lib/admin/guard";
import { getFile, putFile } from "@/lib/admin/github";
import { vehicleSchema } from "@/lib/content-schemas";

export const prerender = false;

/** dc-c3-001.json (kebab-case del internalCode) */
export function vehicleFileName(internalCode: string): string {
  return `${internalCode.toLowerCase()}.json`;
}

export const GET: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;

  // El listado se lee del contenido YA compilado (Content Collections) vía un
  // path fijo: pedimos el índice de vehicles/ a la Contents API de GitHub.
  const url = `https://api.github.com/repos/${guard.github.repo}/contents/src/content/vehicles?ref=${guard.github.branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${guard.github.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "dc-rentals-admin",
    },
  });
  if (!res.ok) return json({ error: `GitHub API ${res.status}` }, res.status);
  const entries = (await res.json()) as Array<{ name: string; path: string }>;

  const vehicles = [];
  for (const entry of entries.filter((e) => e.name.endsWith(".json"))) {
    const file = await getFile(guard.github, entry.path);
    if (!file.ok) continue;
    try {
      const data = JSON.parse(file.data);
      vehicles.push({
        internalCode: data.internalCode,
        name: data.name,
        type: data.type,
        status: data.status,
        active: data.active,
        featured: data.featured,
        slug: data.slug,
        pricePerNightCAD: data.pricePerNightCAD,
        fileName: entry.name,
      });
    } catch {
      // archivo corrupto: lo omitimos del listado pero no rompemos la respuesta
    }
  }
  return json({ vehicles });
};

export const POST: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;

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

  const fileName = vehicleFileName(parsed.data.internalCode);

  // No pisar un truck existente: el cliente debe usar PUT para editar
  const existing = await getFile(guard.github, `src/content/vehicles/${fileName}`);
  if (existing.ok) {
    return json(
      {
        error: "ALREADY_EXISTS",
        message: `Ya existe un truck con código ${parsed.data.internalCode}. Usa PUT para editar.`,
      },
      409
    );
  }

  const content = `${JSON.stringify(parsed.data, null, 2)}\n`;
  const result = await putFile(
    guard.github,
    `src/content/vehicles/${fileName}`,
    content,
    `content(vehicles): add ${parsed.data.internalCode} — ${parsed.data.name}`
  );
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ ok: true, commitSha: result.data.commitSha }, 201);
};
