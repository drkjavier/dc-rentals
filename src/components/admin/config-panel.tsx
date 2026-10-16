// src/components/admin/config-panel.tsx — Pestaña "Configuración" (ADR-020 + ADR-022)
// Edita el singleton site_config en Supabase: branding, logo (icono o imagen)
// e imagen panorámica del hero. Las imágenes se suben al bucket Storage
// `admin-images` y se guarda su URL pública.
import { useEffect, useState, type ChangeEvent } from "react";
import {
  adminFetch,
  fileToBase64,
  ApiError,
} from "@/lib/admin/api-client";

interface SiteConfig {
  brandName: string;
  logo: {
    type: "icon" | "image";
    icon: "van" | "mountain" | "compass" | "map";
    image: string | null;
    backgroundColor: string;
  };
  hero: { image: string; overlayOpacity: number };
}

const EMPTY: SiteConfig = {
  brandName: "DC Rentals",
  logo: { type: "icon", icon: "van", image: null, backgroundColor: "#1E40AF" },
  hero: { image: "/images/hero/hero-rv.svg", overlayOpacity: 60 },
};

const ICON_OPTIONS = [
  { value: "van", label: "🚐 Camioneta" },
  { value: "mountain", label: "⛰️ Montaña" },
  { value: "compass", label: "🧭 Brújula" },
  { value: "map", label: "🗺️ Mapa" },
];

const input =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30";

/** Mensaje claro para el operador cuando Supabase no está en el entorno (ADR-014 + ADR-022). */
function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    // 503 = DATABASE_NOT_CONFIGURED (único 503 del backend): el operador necesita
    // saber qué variables definir en Vercel.
    if (err.status === 503) {
      return "Supabase no está configurado en el entorno. Define PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y VERCEL_DEPLOY_HOOK en Vercel.";
    }
    return err.message;
  }
  return fallback;
}

export function ConfigPanel() {
  const [config, setConfig] = useState<SiteConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    kind: "ok" | "warn" | "err";
    msg: string;
  } | null>(null);

  useEffect(() => {
    adminFetch<{ config: SiteConfig }>("/api/admin/site-config")
      .then((r) => setConfig({ ...EMPTY, ...r.config }))
      .catch((e) =>
        setStatus({
          kind: "err",
          msg: describeError(e, "No se pudo cargar la configuración"),
        })
      )
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
    setStatus(null);
  }

  async function uploadImage(
    e: ChangeEvent<HTMLInputElement>,
    target: "logo" | "hero"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(null);
    try {
      const base64 = await fileToBase64(file);
      // ADR-022: la respuesta trae la URL PÚBLICA de Storage (`url`); ya no
      // hay campo `path`. Se guarda la URL completa en el config.
      const res = await adminFetch<{ url: string }>("/api/admin/upload", {
        method: "POST",
        body: { name: file.name, dataBase64: base64 },
      });
      if (target === "logo") {
        update("logo", { ...config.logo, type: "image", image: res.url });
      } else {
        update("hero", { ...config.hero, image: res.url });
      }
      setStatus({
        kind: "ok",
        msg: `Imagen subida: ${res.url} — recuerda pulsar "Guardar cambios" para aplicarla.`,
      });
    } catch (err) {
      setStatus({
        kind: "err",
        msg: describeError(err, "Error al subir la imagen"),
      });
    }
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await adminFetch<{ ok: boolean; deploy: "triggered" | "skipped" }>(
        "/api/admin/site-config",
        { method: "PUT", body: config }
      );
      if (res.deploy === "triggered") {
        setStatus({
          kind: "ok",
          msg: "Cambios guardados. Publicando en ~30 s...",
        });
      } else {
        setStatus({
          kind: "warn",
          msg: "Cambios guardados en la base de datos, pero no hay Deploy Hook configurado: no se redesplegará automáticamente.",
        });
      }
    } catch (err) {
      setStatus({
        kind: "err",
        msg: describeError(err, "Error al guardar"),
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-neutral-500">Cargando configuración…</p>;

  return (
    <div className="space-y-8">
      {/* Branding */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold">Marca</h2>
        <label className="mt-4 block text-sm font-medium text-neutral-700" htmlFor="brandName">
          Nombre del sitio
        </label>
        <input
          id="brandName"
          className={input}
          value={config.brandName}
          onChange={(e) => update("brandName", e.target.value)}
        />
      </section>

      {/* Logo */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold">Logo (cabecera)</h2>
        <div className="mt-4 flex items-center gap-4">
          {/* Preview */}
          <span
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg text-white"
            style={{ backgroundColor: config.logo.backgroundColor }}
            aria-hidden="true"
          >
            {config.logo.type === "image" && config.logo.image ? (
              <img src={config.logo.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {config.logo.icon === "van" && (
                  <>
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <path d="M9 17h6" />
                    <path d="M7 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
                    <path d="M17 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
                  </>
                )}
                {config.logo.icon === "mountain" && <path d="m8 3 4 8 5-5 5 15H2L8 3z" />}
                {config.logo.icon === "compass" && (
                  <>
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20" />
                    <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12" />
                  </>
                )}
                {config.logo.icon === "map" && (
                  <>
                    <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
                    <path d="M15 5.764v15" />
                    <path d="M9 3.236v15" />
                  </>
                )}
              </svg>
            )}
          </span>
          <span className="font-heading text-lg font-extrabold">{config.brandName}</span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700" htmlFor="logoType">
              Tipo de logo
            </label>
            <select
              id="logoType"
              className={input}
              value={config.logo.type}
              onChange={(e) =>
                update("logo", {
                  ...config.logo,
                  type: e.target.value as "icon" | "image",
                })
              }
            >
              <option value="icon">Icono (catálogo)</option>
              <option value="image">Imagen subida</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700" htmlFor="logoBg">
              Color de fondo
            </label>
            <input
              id="logoBg"
              type="color"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300"
              value={config.logo.backgroundColor}
              onChange={(e) =>
                update("logo", { ...config.logo, backgroundColor: e.target.value })
              }
            />
          </div>
        </div>

        {config.logo.type === "icon" ? (
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700" htmlFor="logoIcon">
              Icono
            </label>
            <select
              id="logoIcon"
              className={input}
              value={config.logo.icon}
              onChange={(e) =>
                update("logo", {
                  ...config.logo,
                  icon: e.target.value as SiteConfig["logo"]["icon"],
                })
              }
            >
              {ICON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700" htmlFor="logoUpload">
              Imagen del logo
            </label>
            <input
              id="logoUpload"
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={(e) => uploadImage(e, "logo")}
            />
            {config.logo.image && (
              <p className="mt-1 text-xs text-neutral-500">Actual: {config.logo.image}</p>
            )}
          </div>
        )}
      </section>

      {/* Hero */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold">Imagen panorámica (hero)</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
          <div className="relative h-40 bg-neutral-900">
            <img
              src={config.hero.image}
              alt="Vista previa del hero"
              className="h-full w-full object-cover"
              style={{ opacity: config.hero.overlayOpacity / 100 }}
            />
            <div className="absolute inset-0 flex items-center bg-gradient-to-r from-neutral-900/90 via-neutral-900/60 to-transparent p-4">
              <p className="max-w-xs font-heading text-lg font-extrabold text-white">
                Explore Canada in Your Home on Wheels
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700" htmlFor="heroUpload">
              Cambiar imagen
            </label>
            <input
              id="heroUpload"
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={(e) => uploadImage(e, "hero")}
            />
            <p className="mt-1 text-xs text-neutral-500">Actual: {config.hero.image}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700" htmlFor="heroOpacity">
              Opacidad de la imagen: {config.hero.overlayOpacity}%
            </label>
            <input
              id="heroOpacity"
              type="range"
              min={0}
              max={100}
              value={config.hero.overlayOpacity}
              onChange={(e) =>
                update("hero", { ...config.hero, overlayOpacity: Number(e.target.value) })
              }
              className="mt-3 w-full"
            />
          </div>
        </div>
      </section>

      {status && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-sm ${
            status.kind === "ok"
              ? "bg-green-50 text-green-800"
              : status.kind === "warn"
                ? "bg-amber-50 text-amber-800"
                : "bg-red-50 text-red-700"
          }`}
        >
          {status.msg}
        </p>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  );
}
