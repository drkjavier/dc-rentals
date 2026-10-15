// src/pages/api/admin/site-config.ts — ADR-020
// GET: devuelve el config actual (leído del repo vía GitHub).
// PUT: valida con Zod y commitea src/config/site-config.json.
import type { APIRoute } from "astro";
import { requireAdmin, json } from "@/lib/admin/guard";
import { getFile, putFile } from "@/lib/admin/github";
import { siteConfigSchema } from "@/lib/site-config";

export const prerender = false;

const PATH = "src/config/site-config.json";

export const GET: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;

  const file = await getFile(guard.github, PATH);
  if (!file.ok) return json({ error: file.error }, file.status);
  return json({ config: JSON.parse(file.data) });
};

export const PUT: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "JSON inválido en el cuerpo" }, 400);
  }

  const parsed = siteConfigSchema.safeParse(body);
  if (!parsed.success) {
    // 400 con errores de Zod — NO se commitea nada
    return json(
      { error: "VALIDATION_FAILED", details: parsed.error.flatten() },
      400
    );
  }

  const content = `${JSON.stringify(parsed.data, null, 2)}\n`;
  const result = await putFile(
    guard.github,
    PATH,
    content,
    "chore(site): update site config (logo/hero/branding)"
  );
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ ok: true, commitSha: result.data.commitSha });
};
