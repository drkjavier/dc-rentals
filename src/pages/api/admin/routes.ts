// src/pages/api/admin/routes.ts — ADR-020
// GET: lista las rutas agrupadas por slug (en/fr) leyendo el directorio.
import type { APIRoute } from "astro";
import { requireAdmin, json } from "@/lib/admin/guard";
import { getFile } from "@/lib/admin/github";
import { parseRouteMdx } from "@/lib/admin/route-mdx";

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

  const url = `https://api.github.com/repos/${guard.github.repo}/contents/src/content/routes?ref=${guard.github.branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${guard.github.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "dc-rentals-admin",
    },
  });
  if (!res.ok) return json({ error: `GitHub API ${res.status}` }, res.status);
  const entries = (await res.json()) as Array<{ name: string; path: string }>;

  const routes: RouteFileInfo[] = [];
  for (const entry of entries.filter((e) => e.name.endsWith(".mdx"))) {
    // nombre = <slug>.<locale>.mdx (p. ej. rocky-mountains.en.mdx)
    const m = /^(.*)\.([a-z]{2})\.mdx$/.exec(entry.name);
    if (!m) continue;
    const [, slug, locale] = m;

    let name: string | undefined;
    let active: boolean | undefined;
    const file = await getFile(guard.github, entry.path);
    if (file.ok) {
      try {
        const { data } = parseRouteMdx(file.data);
        name = typeof data.name === "string" ? data.name : undefined;
        active = typeof data.active === "boolean" ? data.active : undefined;
      } catch {
        // MDX corrupto: aparece en el listado sin nombre para que el admin lo repare
      }
    }
    routes.push({ slug, locale, fileName: entry.name, name, active });
  }
  return json({ routes });
};
