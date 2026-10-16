// src/lib/admin/deploy.ts — Deploy Hook de Vercel (server-only) — ADR-022
// Tras cada guardado exitoso del panel /admin, el endpoint llama a
// triggerDeployHook() para redesplegar el sitio SSG (~30 s). El build lee el
// catálogo desde Supabase (ADR-022), así que el redespliegue publica los
// cambios.
//
// Env var (solo server, JAMÁS PUBLIC_*):
//   VERCEL_DEPLOY_HOOK — URL del Deploy Hook de Vercel (opcional; sin ella
//                        el guardado funciona pero responde deploy=skipped)
//
// Diseño degradado (ADR-014): NUNCA lanza excepción. Cualquier fallo
// (red, timeout, hook caído) se reporta como { triggered: false } para que
// el guardado en Supabase no se pierda por un problema del redespliegue.

/** Nombre de la env var del Deploy Hook (exportado para tests/docs). */
export const DEPLOY_ENV = "VERCEL_DEPLOY_HOOK";

/** Timeout de la petición al hook (~5 s). */
export const DEPLOY_TIMEOUT_MS = 5_000;

/**
 * Dispara el Deploy Hook de Vercel con un motivo descriptivo (va en el body
 * como campo "custom", visible en el log de deploys de Vercel).
 * - Sin env var configurada → { triggered: false }.
 * - Fetch con timeout abortable; nunca lanza excepción.
 */
export async function triggerDeployHook(
  reason: string
): Promise<{ triggered: boolean }> {
  const hook = import.meta.env[DEPLOY_ENV] as string | undefined;
  if (!hook) return { triggered: false };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEPLOY_TIMEOUT_MS);
  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom: reason }),
      signal: controller.signal,
    });
    return { triggered: res.ok };
  } catch {
    // red caída o timeout abortado: degradamos sin romper el guardado
    return { triggered: false };
  } finally {
    clearTimeout(timer);
  }
}
