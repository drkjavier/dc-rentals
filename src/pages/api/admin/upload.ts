// src/pages/api/admin/upload.ts — ADR-020
// POST: sube una imagen (base64) a public/images/admin/<nombre> via GitHub.
// Cuerpo: { name: "hero-new.jpg", dataBase64: "..." }
import type { APIRoute } from "astro";
import { requireAdmin, json } from "@/lib/admin/guard";
import { putImage } from "@/lib/admin/github";

export const prerender = false;

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

  // Guardamos en una carpeta única por fecha para evitar colisiones y caché vieja
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const path = `public/images/admin/${yyyy}-${mm}/${name}`;

  const result = await putImage(
    guard.github,
    path,
    dataBase64,
    `content(images): upload ${path}`
  );
  if (!result.ok) {
    // 413 viene del límite de tamaño ya validado en el cliente y el server
    return json({ error: result.error }, result.status);
  }

  // La ruta pública que consume el sitio (sin prefijo public/)
  const publicPath = `/${path.replace(/^public\//, "")}`;
  return json({ ok: true, path: publicPath, mime, commitSha: result.data.commitSha }, 201);
};
