// tests/unit/deploy.test.ts — ADR-022
// Valida triggerDeployHook: sin VERCEL_DEPLOY_HOOK devuelve { triggered: false },
// con hook hace un POST correcto y devuelve true, y NUNCA lanza excepción
// aunque fetch rechace o el timeout se agote.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { triggerDeployHook, DEPLOY_ENV, DEPLOY_TIMEOUT_MS } from "@/lib/admin/deploy";

// import.meta.env en Vitest: mismo patrón que admin-auth.test.ts
function setDeployHook(value: string | undefined) {
  const env = import.meta.env as Record<string, string | undefined>;
  if (value === undefined) {
    delete env[DEPLOY_ENV];
  } else {
    env[DEPLOY_ENV] = value;
  }
}

const fetchMock = vi.fn();

beforeEach(() => {
  setDeployHook(undefined);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  setDeployHook(undefined);
});

describe("triggerDeployHook", () => {
  it("devuelve { triggered: false } si VERCEL_DEPLOY_HOOK no está definida", async () => {
    const result = await triggerDeployHook("content(vehicles): update DC-C3-001");
    expect(result).toEqual({ triggered: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hace un POST al hook y devuelve { triggered: true } en respuesta OK", async () => {
    setDeployHook("https://api.vercel.com/v1/integrations/deploy/test-hook");
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    const result = await triggerDeployHook("content(routes): update rocky-mountains.en");

    expect(result).toEqual({ triggered: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.vercel.com/v1/integrations/deploy/test-hook");
    expect(init?.method).toBe("POST");
    // el motivo viaja en el body como hook "custom" de Vercel
    expect(JSON.stringify(init?.body)).toContain("content(routes): update rocky-mountains.en");
  });

  it("devuelve { triggered: false } si fetch rechaza (nunca lanza)", async () => {
    setDeployHook("https://api.vercel.com/v1/integrations/deploy/test-hook");
    fetchMock.mockRejectedValue(new Error("red caída"));

    await expect(triggerDeployHook("x")).resolves.toEqual({ triggered: false });
  });

  it("devuelve { triggered: false } si el hook responde con error HTTP", async () => {
    setDeployHook("https://api.vercel.com/v1/integrations/deploy/test-hook");
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    await expect(triggerDeployHook("x")).resolves.toEqual({ triggered: false });
  });

  it("aplica timeout abortable (~5 s) a la petición", async () => {
    vi.useFakeTimers();
    try {
      setDeployHook("https://api.vercel.com/v1/integrations/deploy/test-hook");
      // simula una petición que nunca resuelve y que solo rechaza al abortar
      fetchMock.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError"))
            );
          })
      );

      const pending = triggerDeployHook("x");
      await vi.advanceTimersByTimeAsync(DEPLOY_TIMEOUT_MS);
      const result = await pending;

      expect(result).toEqual({ triggered: false });
      const [, init] = fetchMock.mock.calls[0];
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      expect(DEPLOY_TIMEOUT_MS).toBeGreaterThanOrEqual(4000);
      expect(DEPLOY_TIMEOUT_MS).toBeLessThanOrEqual(10000);
    } finally {
      vi.useRealTimers();
    }
  });
});
