// src/pages/api/admin/routes/[slug].ts — ADR-020 + ADR-022
// GET: devuelve ambas versiones (en/fr) de una ruta para editarlas.
// PUT: valida routeSchema y hace upsert en routes_catalog (?locale=en|fr).
import type { APIRoute } from "astro";
import { requireAdmin, json, databaseNotConfigured } from "@/lib/admin/guard";
import { getRoute, upsertRoute } from "@/lib/admin/catalog-db";
import { triggerDeployHook } from "@/lib/admin/deploy";
import { routeSchema } from "@/lib/content-schemas";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Locale } from "@/lib/i18n";

export const prerender = false;

const LOCALES = ["en", "fr"] as const;

export const GET: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;
  if (!isSupabaseConfigured()) return databaseNotConfigured();

  const slug = context.params.slug!;
  const result: Record<string, { data: unknown; body: string } | null> = {};

  for (const locale of LOCALES) {
    const route = await getRoute(slug, locale);
    // Ruta inexistente o frontmatter inválido: se muestra como ausente para
    // que el admin lo repare desde el formulario (sin romper el listado)
    result[locale] = route ? { data: route.data, body: route.body } : null;
  }
  return json({ slug, locales: result });
};

export const PUT: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;
  if (!isSupabaseConfigured()) return databaseNotConfigured();

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
  // El locale del frontmatter debe coincidir con el parámetro de la URL
  if (parsed.data.locale !== locale) {
    return json(
      {
        error: "LOCALE_MISMATCH",
        message: `El frontmatter dice locale=${parsed.data.locale} pero la URL pide locale=${locale}.`,
      },
      400
    );
  }

  const existing = await getRoute(slug, locale as Locale);
  if (!existing) {
    return json(
      {
        error: "ROUTE_NOT_FOUND",
        message: `No existe la ruta ${slug}.${locale} para editar.`,
      },
      404
    );
  }

  const saved = await upsertRoute(slug, locale as Locale, parsed.data, payload.body);
  if (!saved) {
    return json(
      { error: "WRITE_FAILED", message: "No se pudo guardar la ruta en routes_catalog." },
      500
    );
  }

  const { triggered } = await triggerDeployHook(
    `content(routes): update ${slug}.${locale} — ${parsed.data.name}`
  );
  return json({ ok: true, deploy: triggered ? "triggered" : "skipped" });
};
