// src/pages/api/admin/routes/[slug].ts — ADR-020
// GET: devuelve ambas versiones (en/fr) de una ruta para editarlas.
// PUT: valida routeSchema y commitea el .mdx del locale indicado (?locale=en|fr).
import type { APIRoute } from "astro";
import { requireAdmin, json } from "@/lib/admin/guard";
import { getFile, putFile } from "@/lib/admin/github";
import { parseRouteMdx, serializeRouteMdx } from "@/lib/admin/route-mdx";
import { routeSchema } from "@/lib/content-schemas";

export const prerender = false;

const LOCALES = ["en", "fr"] as const;

export const GET: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;

  const slug = context.params.slug!;
  const result: Record<string, { data: unknown; body: string } | null> = {};

  for (const locale of LOCALES) {
    const file = await getFile(
      guard.github,
      `src/content/routes/${slug}.${locale}.mdx`
    );
    if (!file.ok) {
      result[locale] = null;
      continue;
    }
    try {
      const { data, body } = parseRouteMdx(file.data);
      result[locale] = { data, body };
    } catch (e) {
      return json(
        { error: `No se pudo parsear ${slug}.${locale}.mdx: ${(e as Error).message}` },
        502
      );
    }
  }
  return json({ slug, locales: result });
};

export const PUT: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;

  const slug = context.params.slug!;
  const url = new URL(context.request.url);
  const locale = url.searchParams.get("locale");
  if (!locale || !(LOCALES as readonly string[]).includes(locale)) {
    return json({ error: "locale requerido: ?locale=en o ?locale=fr" }, 400);
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "JSON inválido en el cuerpo" }, 400);
  }

  // El cuerpo espera { data: frontmatter, body: markdown }
  const payload = body as { data?: unknown; body?: unknown };
  if (typeof payload.data !== "object" || payload.data === null) {
    return json({ error: "Falta el campo data (frontmatter)" }, 400);
  }
  if (typeof payload.body !== "string") {
    return json({ error: "Falta el campo body (markdown)" }, 400);
  }

  const parsed = routeSchema.safeParse(payload.data);
  if (!parsed.success) {
    return json(
      { error: "VALIDATION_FAILED", details: parsed.error.flatten() },
      400
    );
  }
  // El locale del frontmatter debe coincidir con el archivo destino
  if (parsed.data.locale !== locale) {
    return json(
      {
        error: "LOCALE_MISMATCH",
        message: `El frontmatter dice locale=${parsed.data.locale} pero el archivo es ${slug}.${locale}.mdx`,
      },
      400
    );
  }

  const path = `src/content/routes/${slug}.${locale}.mdx`;
  const existing = await getFile(guard.github, path);
  if (!existing.ok) return json({ error: existing.error }, existing.status);

  const content = serializeRouteMdx(parsed.data as Record<string, unknown>, payload.body);
  const result = await putFile(
    guard.github,
    path,
    content,
    `content(routes): update ${slug}.${locale} — ${parsed.data.name}`
  );
  if (!result.ok) return json({ error: result.error }, result.status);
  return json({ ok: true, commitSha: result.data.commitSha });
};
