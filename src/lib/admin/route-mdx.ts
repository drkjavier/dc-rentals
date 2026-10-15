// src/lib/admin/route-mdx.ts — Parseo/serialización de rutas MDX (ADR-020)
// Las rutas viven como archivos .mdx con frontmatter YAML (routeSchema) y un
// cuerpo markdown. El admin edita ambos: aquí se separan y se recomponen.
import yaml from "js-yaml";

export interface RouteMdx {
  /** Datos del frontmatter (validados contra routeSchema por el endpoint) */
  data: Record<string, unknown>;
  /** Cuerpo markdown después del cierre de frontmatter */
  body: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Separa frontmatter y body de un MDX. Lanza si no hay frontmatter válido. */
export function parseRouteMdx(raw: string): RouteMdx {
  const match = FRONTMATTER_RE.exec(raw);
  if (!match) {
    throw new Error("El archivo no tiene frontmatter YAML (--- ... ---)");
  }
  const data = yaml.load(match[1]);
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("El frontmatter no es un objeto YAML");
  }
  const body = raw.slice(match[0].length);
  return { data: data as Record<string, unknown>, body };
}

/** Recompone un archivo MDX completo a partir de data + body. */
export function serializeRouteMdx(data: Record<string, unknown>, body: string): string {
  const frontmatter = yaml.dump(data, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
  // Limpia un BOM inicial (U+FEFF) si existe y normaliza los saltos de línea
  const normalizedBody = body.replace(/^\uFEFF/, "").replace(/^\n+/, "");
  return `---\n${frontmatter}---\n\n${normalizedBody.trimEnd()}\n`;
}
