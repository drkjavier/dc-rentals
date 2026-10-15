// src/lib/admin/api-client.ts — Cliente de los endpoints /api/admin/* (browser)
// ADR-020: el token vive SOLO en sessionStorage (nunca en cookies ni localStorage
// compartido); se adjunta como Authorization: Bearer en cada llamada.

const TOKEN_KEY = "dc_admin_token";

export function getToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Llamada genérica a un endpoint admin. Lanza ApiError en 4xx/5xx. */
export async function adminFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    // 401 = token inválido/expirado: limpiar para forzar re-login
    if (res.status === 401) clearToken();
    const msg =
      (json as { message?: string; error?: string }).message ??
      (json as { error?: string }).error ??
      `Error ${res.status}`;
    throw new ApiError(res.status, msg, (json as { details?: unknown }).details);
  }
  return json as T;
}

/** Convierte un File de imagen a base64 (sin el prefijo data:) para /upload. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.substring(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
