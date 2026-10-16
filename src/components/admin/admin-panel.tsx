// src/components/admin/admin-panel.tsx — Island del panel de administración
// ADR-020 + ADR-022 — pestañas: Configuración (logo/hero/brand), Trucks y Rutas.
// El backend escribe en Supabase y dispara el Deploy Hook de Vercel.
// Flujo: token → sessionStorage → Authorization: Bearer en cada llamada.
import { useEffect, useState } from "react";
import {
  getToken,
  setToken,
  clearToken,
  adminFetch,
  ApiError,
} from "@/lib/admin/api-client";
import { ConfigPanel } from "./config-panel";
import { VehiclesPanel } from "./vehicles-panel";
import { RoutesPanel } from "./routes-panel";

type Tab = "config" | "vehicles" | "routes";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "config", label: "Configuración" },
  { id: "vehicles", label: "Trucks" },
  { id: "routes", label: "Rutas" },
];

export function AdminPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("config");
  const [tokenInput, setTokenInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Al montar: si hay token guardado, verificamos que sigue siendo válido
  // haciendo una llamada ligera al endpoint de config.
  useEffect(() => {
    if (!getToken()) {
      setAuthed(false);
      setChecking(false);
      return;
    }
    adminFetch("/api/admin/site-config")
      .then(() => setAuthed(true))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) setAuthed(false);
        else setAuthed(true); // 503 (no configurado) → dejar pasar; los paneles muestran el aviso
      })
      .finally(() => setChecking(false));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setToken(tokenInput);
    try {
      await adminFetch("/api/admin/site-config");
      setAuthed(true);
      setTokenInput("");
    } catch (err) {
      clearToken();
      if (err instanceof ApiError && err.status === 401) {
        setLoginError("Token inválido o expirado. Inténtalo de nuevo.");
      } else if (err instanceof ApiError && err.status === 503) {
        setLoginError(
          "Supabase no está configurado en el entorno. Define PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y VERCEL_DEPLOY_HOOK en Vercel."
        );
      } else {
        setLoginError(
          err instanceof ApiError ? err.message : "No se pudo verificar el token"
        );
      }
    }
  }

  function handleLogout() {
    clearToken();
    setAuthed(false);
    setTab("config");
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-500">
        Comprobando acceso…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm"
        >
          <h1 className="font-heading text-2xl font-extrabold text-neutral-900">
            Panel de administración
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Introduce el token ADMIN_TOKEN configurado en Vercel.
          </p>
          <label
            htmlFor="admin-token"
            className="mt-6 block text-sm font-medium text-neutral-700"
          >
            Token
          </label>
          <input
            id="admin-token"
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            placeholder="••••••••••••"
            required
          />
          {loginError && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-extrabold text-neutral-900">
          DC Rentals · Admin
        </h1>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
        >
          Cerrar sesión
        </button>
      </header>

      <nav className="mt-4 flex gap-1 border-b border-neutral-200" aria-label="Secciones">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="mt-6">
        {tab === "config" && <ConfigPanel />}
        {tab === "vehicles" && <VehiclesPanel />}
        {tab === "routes" && <RoutesPanel />}
      </main>
    </div>
  );
}

export default AdminPanel;
