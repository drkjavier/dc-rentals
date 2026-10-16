// tests/unit/admin-auth.test.ts — ADR-020
// Verifica la autenticación del panel: comparación timing-safe del bearer
// token y rechazo de esquemas ausentes/incorrectos.
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { verifyAdminToken, isAuthConfigured } from "@/lib/admin/auth";

// import.meta.env en Vitest: simulamos ADMIN_TOKEN por test
function setEnvToken(token: string | undefined) {
  if (token === undefined) {
    // permitimos borrar la env para el test (tipo compatible con ImportMetaEnv)
    delete import.meta.env.ADMIN_TOKEN;
  } else {
    import.meta.env.ADMIN_TOKEN = token;
  }
}

describe("verifyAdminToken", () => {
  beforeEach(() => setEnvToken("secreto-123"));
  afterEach(() => setEnvToken(undefined));

  it("acepta el bearer token correcto", () => {
    expect(verifyAdminToken("Bearer secreto-123")).toBe(true);
  });

  it("rechaza un token incorrecto", () => {
    expect(verifyAdminToken("Bearer otro-token")).toBe(false);
  });

  it("rechaza un header sin esquema Bearer", () => {
    expect(verifyAdminToken("Token secreto-123")).toBe(false);
    expect(verifyAdminToken("secreto-123")).toBe(false);
  });

  it("rechaza header ausente o vacío", () => {
    expect(verifyAdminToken(null)).toBe(false);
    expect(verifyAdminToken("")).toBe(false);
  });

  it("rechaza un token de distinta longitud sin lanzar", () => {
    expect(verifyAdminToken("Bearer x")).toBe(false);
    expect(verifyAdminToken("Bearer secreto-123-extra-largo")).toBe(false);
  });

  it("rechaza todo si ADMIN_TOKEN no está configurado", () => {
    setEnvToken(undefined);
    expect(verifyAdminToken("Bearer secreto-123")).toBe(false);
  });
});

describe("isAuthConfigured", () => {
  it("devuelve true con token y false sin él", () => {
    setEnvToken("abc");
    expect(isAuthConfigured()).toBe(true);
    setEnvToken(undefined);
    expect(isAuthConfigured()).toBe(false);
  });
});

// Limpieza por si un test deja la env plantada
afterEach(() => {
  vi.restoreAllMocks();
  setEnvToken(undefined);
});
