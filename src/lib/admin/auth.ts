// src/lib/admin/auth.ts — Autenticación del panel de administración
// ADR-020: token compartido (ADMIN_TOKEN env var) comparado con timing-safe
// compare para evitar timing attacks. El token viaja en el header
// Authorization: Bearer <token> y NUNCA se persiste en el servidor
// (solo sessionStorage en el cliente).
import { timingSafeEqual } from "node:crypto";

export function getAdminToken(): string | null {
  return (import.meta.env.ADMIN_TOKEN as string | undefined) || null;
}

export function isAuthConfigured(): boolean {
  return getAdminToken() !== null;
}

/**
 * Verifica un bearer token contra ADMIN_TOKEN de forma timing-safe.
 * Devuelve false si no hay token configurado (nadie puede autenticarse).
 */
export function verifyAdminToken(
  authorizationHeader: string | null
): boolean {
  const expected = getAdminToken();
  if (!expected || !authorizationHeader) return false;

  const [scheme, provided] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !provided) return false;

  // timingSafeEqual exige buffers de igual longitud; comparar longitudes
  // primero con secreto falso iguala el coste cuando difieren.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b); // consumo constante
    return false;
  }
  return timingSafeEqual(a, b);
}
