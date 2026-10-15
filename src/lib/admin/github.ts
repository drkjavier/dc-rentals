// src/lib/admin/github.ts — Cliente de la GitHub Contents API (server-only)
// ADR-020: el panel admin escribe cambios de contenido commiteando directo a
// la rama main del repo desplegado (dc-rentals-app) mediante la Contents API.
// Vercel detecta el push y redespliega a producción (~30 s).
//
// Env vars requeridas (solo server, JAMÁS PUBLIC_*):
//   GITHUB_TOKEN   — PAT con scope "repo" (o contents:write en org)
//   GITHUB_REPO    — "owner/name" (p. ej. "drkjavier/dc-rentals-app")
//   GITHUB_BRANCH  — rama destino (default: "main")
//
// Límite: la Contents API admite archivos de hasta 1 MB vía PUT directo.

const GITHUB_API = "https://api.github.com";
export const MAX_UPLOAD_BYTES = 1_000_000; // 1 MB (límite Contents API)

export interface GithubConfig {
  token: string;
  repo: string;
  branch: string;
}

export type GithubResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

/** Lee la config de GitHub desde env vars. null si falta algo (→ 503). */
export function getGithubConfig(): GithubConfig | null {
  const token = import.meta.env.GITHUB_TOKEN as string | undefined;
  const repo = import.meta.env.GITHUB_REPO as string | undefined;
  const branch =
    (import.meta.env.GITHUB_BRANCH as string | undefined) || "main";
  if (!token || !repo) return null;
  return { token, repo, branch };
}

function headers(cfg: GithubConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "dc-rentals-admin",
  };
}

function encodeContent(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64");
}

function decodeContent(base64: string): string {
  return Buffer.from(base64, "base64").toString("utf-8");
}

/** GET de un archivo de texto del repo. 404 si no existe. */
export async function getFile(
  cfg: GithubConfig,
  path: string
): Promise<GithubResult<string>> {
  const url = `${GITHUB_API}/repos/${cfg.repo}/contents/${encodeURIComponent(
    path
  )}?ref=${cfg.branch}`;
  const res = await fetch(url, { headers: headers(cfg) });
  if (res.status === 404) {
    return { ok: false, error: `El archivo ${path} no existe`, status: 404 };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: `GitHub API ${res.status}: ${await res.text()}`,
      status: res.status,
    };
  }
  const json = (await res.json()) as { content?: string; encoding?: string };
  if (!json.content || json.encoding !== "base64") {
    return { ok: false, error: "Respuesta inesperada de GitHub", status: 502 };
  }
  return { ok: true, data: decodeContent(json.content) };
}

/**
 * PUT (crear o actualizar) un archivo de texto. Si `sha` se omite y el archivo
 * ya existe, la Contents API responde 409 — en ese caso leemos el sha y
 * reintentamos una vez (optimista → seguro ante carreras ligeras).
 */
export async function putFile(
  cfg: GithubConfig,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<GithubResult<{ sha: string; commitSha: string }>> {
  const url = `${GITHUB_API}/repos/${cfg.repo}/contents/${encodeURIComponent(
    path
  )}`;
  const body = {
    message,
    content: encodeContent(content),
    branch: cfg.branch,
    ...(sha ? { sha } : {}),
  };

  let res = await fetch(url, {
    method: "PUT",
    headers: { ...headers(cfg), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // 409 = el archivo existe y no pasamos sha → leer sha y reintentar
  if (res.status === 409 && !sha) {
    const current = await getFile(cfg, path);
    if (!current.ok) return current;
    const meta = await fetch(
      `${url}?ref=${cfg.branch}`,
      { headers: headers(cfg) }
    );
    if (!meta.ok) {
      return {
        ok: false,
        error: `No se pudo obtener el sha actual (${meta.status})`,
        status: meta.status,
      };
    }
    const { sha: existingSha } = (await meta.json()) as { sha: string };
    res = await fetch(url, {
      method: "PUT",
      headers: { ...headers(cfg), "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, sha: existingSha }),
    });
  }

  if (!res.ok) {
    return {
      ok: false,
      error: `GitHub API ${res.status}: ${await res.text()}`,
      status: res.status,
    };
  }
  const json = (await res.json()) as {
    content: { sha: string };
    commit: { sha: string };
  };
  return { ok: true, data: { sha: json.content.sha, commitSha: json.commit.sha } };
}

/**
 * Sube un archivo binario (ya en base64) a public/images/....
 * Valida el límite de 1 MB ANTES de llamar a la API.
 */
export async function putImage(
  cfg: GithubConfig,
  path: string,
  base64Content: string,
  message: string
): Promise<GithubResult<{ sha: string; commitSha: string }>> {
  const approxBytes = Math.floor((base64Content.length * 3) / 4);
  if (approxBytes > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `La imagen supera el límite de 1 MB (${Math.round(
        approxBytes / 1024
      )} KB). Comprímela e inténtalo de nuevo.`,
      status: 413,
    };
  }
  // La Contents API espera base64 sin saltos de línea
  const clean = base64Content.replace(/\s/g, "");
  const url = `${GITHUB_API}/repos/${cfg.repo}/contents/${encodeURIComponent(
    path
  )}`;
  const body = { message, content: clean, branch: cfg.branch };

  let res = await fetch(url, {
    method: "PUT",
    headers: { ...headers(cfg), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    const meta = await fetch(`${url}?ref=${cfg.branch}`, {
      headers: headers(cfg),
    });
    if (meta.ok) {
      const { sha } = (await meta.json()) as { sha: string };
      res = await fetch(url, {
        method: "PUT",
        headers: { ...headers(cfg), "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, sha }),
      });
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      error: `GitHub API ${res.status}: ${await res.text()}`,
      status: res.status,
    };
  }
  const json = (await res.json()) as {
    content: { sha: string };
    commit: { sha: string };
  };
  return { ok: true, data: { sha: json.content.sha, commitSha: json.commit.sha } };
}
