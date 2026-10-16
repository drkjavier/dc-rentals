// src/pages/api/admin/routes.ts — ADR-020 + ADR-022
// GET: lista las rutas agrupadas por slug (en/fr) leyendo routes_catalog.
import type { APIRoute } from "astro";
import { requireAdmin, json, databaseNotConfigured } from "@/lib/admin/guard";
import { listRoutes } from "@/lib/admin/catalog-db";
import { isSupabaseConfigured } from "@/lib/supabase";

export const prerender = false;

export interface RouteFileInfo {
  slug: string;
  locale: string;
  fileName: string;
  name?: string;
  active?: boolean;
}

export const GET: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;
  if (!isSupabaseConfigured()) return databaseNotConfigured();

  const routes = await listRoutes();
  if (!routes) {
    return json(
      { error: "DATABASE_ERROR", message: "No se pudo leer routes_catalog." },
      500
    );
  }

  return json({
    routes: routes.map((r) => ({
      slug: r.slug,
      locale: r.data.locale,
      fileName: `${r.slug}.${r.data.locale}.mdx`, // shape legacy del panel
      name: r.data.name,
      active: r.data.active,
    })),
  });
};
