// src/pages/api/admin/upload.ts — ADR-020 + ADR-022
// POST: sube una imagen (base64) al bucket Storage `admin-images` en
// admin/<AAAA-MM>/<nombre> y responde con su URL pública.
// Cuerpo: { name: "hero-new.jpg", dataBase64: "..." }
import type { APIRoute } from "astro";
import { requireAdmin, json, databaseNotConfigured } from "@/lib/admin/guard";
import { triggerDeployHook } from "@/lib/admin/deploy";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase";

export const prerender = false;

/** Bucket público en lectura, escritura solo service role (ADR-022). */
export const STORAGE_BUCKET = "admin-images";

/** Límite de tamaño (1 MB, heredado de la Contents API de GitHub). */
export const MAX_UPLOAD_BYTES = 1_000_000;

// Solo formatos seguros para web; el nombre se sanea para evitar path traversal
const SAFE_NAME_RE = /^[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp|svg|avif)$/i;
const EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
};

export const POST: APIRoute = async (context) => {
  const guard = requireAdmin(context);
  if (!guard.ok) return guard.response;
  if (!isSupabaseConfigured()) return databaseNotConfigured();
  const supabase = getSupabaseServer()!;

  let body: { name?: unknown; dataBase64?: unknown };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "JSON inválido en el cuerpo" }, 400);
  }

  const { name, dataBase64 } = body;
  if (typeof name !== "string" || !SAFE_NAME_RE.test(name)) {
    return json(
      {
        error: "INVALID_NAME",
        message:
          "El nombre debe ser un archivo de imagen válido (png, jpg, webp, svg, avif) sin rutas.",
      },
      400
    );
  }
  if (typeof dataBase64 !== "string" || dataBase64.length === 0) {
    return json({ error: "Falta dataBase64" }, 400);
  }

  // Detección de MIME real por extensión (no confiamos en el cliente)
  const ext = name.split(".").pop()!.toLowerCase();
  const mime = EXT_MIME[ext];

  const bytes = Buffer.from(dataBase64, "base64");
  if (bytes.length === 0) {
    return json({ error: "dataBase64 no contiene datos decodificables" }, 400);
  }
  if (bytes.length > MAX_UPLOAD_BYTES) {
    return json(
      {
        error: "FILE_TOO_LARGE",
        message: `La imagen supera el límite de 1 MB (${Math.round(
          bytes.length / 1024
        )} KB). Comprímela e inténtalo de nuevo.`,
      },
      413
    );
  }

  // Carpeta única por fecha para evitar colisiones y caché vieja
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const path = `admin/${yyyy}-${mm}/${name}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, { contentType: mime });
  if (error) {
    return json({ error: `Storage: ${error.message}` }, 500);
  }

  const { data: publicUrl } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  const { triggered } = await triggerDeployHook(`content(images): upload ${path}`);
  return json(
    { ok: true, url: publicUrl.publicUrl, mime, deploy: triggered ? "triggered" : "skipped" },
    201
  );
};
