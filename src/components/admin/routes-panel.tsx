// src/components/admin/routes-panel.tsx — Pestaña "Rutas" (ADR-020 + ADR-022)
// Lista rutas agrupadas por slug (en/fr) desde Supabase (routes_catalog) y
// permite editar el frontmatter (nombre, paradas, highlights) y el cuerpo
// markdown de cada idioma. Cada guardado dispara el Deploy Hook de Vercel.
import { useCallback, useEffect, useState } from "react";
import { adminFetch, ApiError } from "@/lib/admin/api-client";

interface RouteFile {
  slug: string;
  locale: string;
  fileName: string;
  name?: string;
  active?: boolean;
}

interface Stop {
  name: string;
  lat: number | string;
  lng: number | string;
  description?: string;
}

interface RouteVersion {
  data: Record<string, unknown>;
  body: string;
}

type Status = { kind: "ok" | "warn" | "err"; msg: string } | null;

const input =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30";
const label = "block text-sm font-medium text-neutral-700";

/** Mensaje claro para el operador cuando Supabase no está en el entorno (ADR-022). */
function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 503) {
      return "Supabase no está configurado en el entorno. Define PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y VERCEL_DEPLOY_HOOK en Vercel.";
    }
    return err.message;
  }
  return fallback;
}

/** Traduce `deploy: "triggered" | "skipped"` en un mensaje para el operador. */
function deployMessage(deploy: "triggered" | "skipped", subject: string): { kind: "ok" | "warn"; msg: string } {
  return deploy === "triggered"
    ? { kind: "ok", msg: `${subject}. Publicando en ~30 s...` }
    : {
        kind: "warn",
        msg: `${subject} en la base de datos, pero no hay Deploy Hook configurado: no se redesplegará automáticamente.`,
      };
}

export function RoutesPanel() {
  const [routes, setRoutes] = useState<RouteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ slug: string; locales: Record<string, RouteVersion | null> } | null>(null);
  const [activeLocale, setActiveLocale] = useState<"en" | "fr">("en");
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch<{ routes: RouteFile[] }>("/api/admin/routes")
      .then((r) => setRoutes(r.routes))
      .catch((e) =>
        setStatus({ kind: "err", msg: describeError(e, "Error cargando las rutas") })
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Agrupa por slug: { slug: { en: RouteFile, fr: RouteFile } }
  const grouped = routes.reduce<Record<string, Partial<Record<"en" | "fr", RouteFile>>>>(
    (acc, r) => {
      (acc[r.slug] ??= {})[r.locale as "en" | "fr"] = r;
      return acc;
    },
    {}
  );

  async function startEdit(slug: string) {
    setStatus(null);
    try {
      const r = await adminFetch<{
        slug: string;
        locales: Record<string, RouteVersion | null>;
      }>(`/api/admin/routes/${slug}`);
      setEditing(r);
      setActiveLocale(r.locales.en ? "en" : "fr");
    } catch (e) {
      setStatus({ kind: "err", msg: describeError(e, "Error cargando la ruta") });
    }
  }

  function updateCurrent(patch: Partial<RouteVersion>) {
    setEditing((e) => {
      if (!e) return e;
      const current = e.locales[activeLocale];
      if (!current) return e;
      return {
        ...e,
        locales: { ...e.locales, [activeLocale]: { ...current, ...patch } },
      };
    });
    setStatus(null);
  }

  async function saveLocale() {
    if (!editing) return;
    const version = editing.locales[activeLocale];
    if (!version) return;
    setSaving(true);
    setStatus(null);
    try {
      // ADR-022: la respuesta ya no trae commitSha, solo { ok, deploy }.
      const res = await adminFetch<{ ok: boolean; deploy: "triggered" | "skipped" }>(
        `/api/admin/routes/${editing.slug}?locale=${activeLocale}`,
        {
          method: "PUT",
          body: { data: version.data, body: version.body },
        }
      );
      setStatus(
        deployMessage(res.deploy, `Ruta guardada (${activeLocale.toUpperCase()})`)
      );
    } catch (e) {
      setStatus({ kind: "err", msg: describeError(e, "Error al guardar la ruta") });
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    const version = editing.locales[activeLocale];
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold">Ruta: {editing.slug}</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-neutral-300 p-0.5">
              {(["en", "fr"] as const).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setActiveLocale(loc)}
                  disabled={!editing.locales[loc]}
                  className={`rounded-md px-3 py-1 text-sm font-medium capitalize ${
                    activeLocale === loc
                      ? "bg-brand-primary text-white"
                      : "text-neutral-600 disabled:opacity-40"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEditing(null)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              Volver
            </button>
          </div>
        </div>

        {status && (
          <p
            role="status"
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
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

        {!version ? (
          <p className="mt-6 text-neutral-500">Esta versión no existe todavía.</p>
        ) : (
          <RouteEditor version={version} onChange={updateCurrent} />
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={saveLocale}
            disabled={saving || !version}
            className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : `Guardar ${activeLocale.toUpperCase()}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-bold">Rutas</h2>
      {status && (
        <p
          role="status"
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
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
      {loading ? (
        <p className="mt-6 text-neutral-500">Cargando rutas…</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {Object.entries(grouped).map(([slug, locales]) => (
            <li
              key={slug}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium">{locales.en?.name ?? locales.fr?.name ?? slug}</p>
                <p className="text-xs text-neutral-500">
                  <span className="font-mono">{slug}</span>
                  <span className={`ml-2 rounded px-1.5 py-0.5 ${locales.en ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"}`}>
                    EN
                  </span>
                  <span className={`ml-1 rounded px-1.5 py-0.5 ${locales.fr ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"}`}>
                    FR
                  </span>
                  {locales.en?.active === false && (
                    <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-neutral-600">oculta</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => startEdit(slug)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100"
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RouteEditor({
  version,
  onChange,
}: {
  version: RouteVersion;
  onChange: (patch: Partial<RouteVersion>) => void;
}) {
  const data = version.data;
  const stops = (data.stops ?? []) as Stop[];
  const highlights = Array.isArray(data.highlights) ? (data.highlights as string[]) : [];

  function setField(field: string, value: unknown) {
    onChange({ data: { ...data, [field]: value } });
  }

  function setStop(index: number, patch: Partial<Stop>) {
    const next = stops.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setField("stops", next);
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-semibold">Datos de la ruta</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className={`${label} sm:col-span-2`}>
            Nombre
            <input
              className={input}
              value={String(data.name ?? "")}
              onChange={(e) => setField("name", e.target.value)}
            />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Descripción corta
            <textarea
              rows={2}
              className={input}
              value={String(data.description ?? "")}
              onChange={(e) => setField("description", e.target.value)}
            />
          </label>
          <label className={label}>
            Distancia
            <input
              className={input}
              value={String(data.distance ?? "")}
              onChange={(e) => setField("distance", e.target.value)}
              placeholder="2,800 km"
            />
          </label>
          <label className={label}>
            Duración
            <input
              className={input}
              value={String(data.duration ?? "")}
              onChange={(e) => setField("duration", e.target.value)}
              placeholder="7-10 days"
            />
          </label>
          <label className={label}>
            Dificultad
            <select
              className={input}
              value={String(data.difficulty ?? "easy")}
              onChange={(e) => setField("difficulty", e.target.value)}
            >
              <option value="easy">easy</option>
              <option value="moderate">moderate</option>
              <option value="challenging">challenging</option>
            </select>
          </label>
          <label className={label}>
            Mejor temporada
            <input
              className={input}
              value={String(data.bestSeason ?? "")}
              onChange={(e) => setField("bestSeason", e.target.value)}
              placeholder="June - September"
            />
          </label>
          <label className={label}>
            Imagen (URL o ruta /public)
            <input
              className={input}
              value={String(data.image ?? "")}
              onChange={(e) => setField("image", e.target.value)}
            />
          </label>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.active !== false}
                onChange={(e) => setField("active", e.target.checked)}
              />
              Visible
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Paradas (stops)</h3>
          <button
            onClick={() =>
              setField("stops", [...stops, { name: "", lat: 0, lng: 0, description: "" }])
            }
            className="rounded-lg border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
          >
            + Añadir parada
          </button>
        </div>
        <div className="mt-3 space-y-4">
          {stops.map((stop, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-neutral-200 p-3 sm:grid-cols-[1fr_100px_100px_auto]">
              <input
                className={input}
                value={stop.name}
                onChange={(e) => setStop(i, { name: e.target.value })}
                placeholder="Nombre"
              />
              <input
                className={input}
                value={String(stop.lat)}
                onChange={(e) => setStop(i, { lat: e.target.value })}
                placeholder="Lat"
              />
              <input
                className={input}
                value={String(stop.lng)}
                onChange={(e) => setStop(i, { lng: e.target.value })}
                placeholder="Lng"
              />
              <button
                onClick={() => setField("stops", stops.filter((_, idx) => idx !== i))}
                className="text-sm text-red-600 hover:underline"
              >
                Quitar
              </button>
              <input
                className={`${input} sm:col-span-4`}
                value={stop.description ?? ""}
                onChange={(e) => setStop(i, { description: e.target.value })}
                placeholder="Descripción (opcional)"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-semibold">Highlights (uno por línea)</h3>
        <textarea
          rows={4}
          className={`${input} font-mono text-xs`}
          value={highlights.join("\n")}
          onChange={(e) =>
            setField(
              "highlights",
              e.target.value.split("\n").filter((l) => l.trim().length > 0)
            )
          }
        />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-semibold">Contenido (markdown)</h3>
        <textarea
          rows={10}
          className={`${input} font-mono text-xs`}
          value={version.body}
          onChange={(e) => onChange({ body: e.target.value })}
        />
      </section>
    </div>
  );
}
