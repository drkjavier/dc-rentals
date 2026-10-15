// src/lib/admin/guard.ts — Guards compartidos de los endpoints /api/admin/*
// ADR-020: cada endpoint llama a requireAdmin() como PRIMERA acción para
// responder 401/503 antes de tocar nada. Reutiliza los errores del patrón
// degradación graceful (ADR-014).
import type { APIContext } from "astro";
import { verifyAdminToken, isAuthConfigured } from "./auth";
import { getGithubConfig, type GithubConfig } from "./github";

export const JSON_HEADERS = { "Content-Type": "application/json" };

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export type GuardResult =
  | { ok: true; github: GithubConfig }
  | { ok: false; response: Response };

/**
 * Verifica auth + config de GitHub en un solo paso.
 * - 503 si el admin no está configurado en el entorno.
 * - 401 si el bearer token es ausente o inválido.
 */
export function requireAdmin(context: APIContext): GuardResult {
  if (!isAuthConfigured()) {
    return {
      ok: false,
      response: json(
        {
          error: "ADMIN_NOT_CONFIGURED",
          message:
            "El panel no está configurado: define la variable ADMIN_TOKEN en el entorno de Vercel.",
        },
        503
      ),
    };
  }
  const auth = context.request.headers.get("Authorization");
  if (!verifyAdminToken(auth)) {
    return {
      ok: false,
      response: json({ error: "UNAUTHORIZED", message: "Token inválido." }, 401),
    };
  }
  const github = getGithubConfig();
  if (!github) {
    return {
      ok: false,
      response: json(
        {
          error: "GITHUB_NOT_CONFIGURED",
          message:
            "Faltan GITHUB_TOKEN y/o GITHUB_REPO en el entorno de Vercel. El panel necesita acceso a GitHub para publicar cambios.",
        },
        503
      ),
    };
  }
  return { ok: true, github };
}
