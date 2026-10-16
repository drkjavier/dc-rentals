// src/lib/admin/guard.ts — Guards compartidos de los endpoints /api/admin/*
// ADR-020 + ADR-022: cada endpoint llama a requireAdmin() como PRIMERA acción
// para responder 401/503 antes de tocar nada. La verificación es SOLO auth
// (ADMIN_TOKEN); el backend de escritura es Supabase, no GitHub.
import type { APIContext } from "astro";
import { verifyAdminToken, isAuthConfigured } from "./auth";

export const JSON_HEADERS = { "Content-Type": "application/json" };

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** 503 cuando Supabase no está configurado (degradación graceful, ADR-014). */
export function databaseNotConfigured(): Response {
  return json(
    {
      error: "DATABASE_NOT_CONFIGURED",
      message:
        "La base de datos no está configurada: define PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno de Vercel.",
    },
    503
  );
}

export type GuardResult =
  | { ok: true }
  | { ok: false; response: Response };

/**
 * Verifica la autenticación del panel.
 * - 503 si ADMIN_TOKEN no está configurado en el entorno.
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
  return { ok: true };
}
