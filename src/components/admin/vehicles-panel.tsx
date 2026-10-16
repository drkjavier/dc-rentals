// src/components/admin/vehicles-panel.tsx — Pestaña "Trucks" (ADR-020 + ADR-022)
// Lista los trucks de Supabase, permite crear nuevos y editar existentes.
// El formulario envía el objeto completo; el endpoint valida con vehicleSchema
// (Zod), guarda en la tabla vehicles_catalog y dispara el Deploy Hook de Vercel.
import { useCallback, useEffect, useState } from "react";
import { adminFetch, ApiError } from "@/lib/admin/api-client";

interface VehicleSummary {
  internalCode: string;
  name: string;
  type: string;
  status: string;
  active: boolean;
  featured: boolean;
  slug: string;
  pricePerNightCAD: number;
  fileName: string;
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

const VEHICLE_TYPES = [
  "CLASS_A",
  "CLASS_B",
  "CLASS_C",
  "TRAVEL_TRAILER",
  "FIFTH_WHEEL",
  "TRUCK_CAMPER",
  "CAMPER_VAN",
];
const STATUSES = ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "PARTIALLY_BOOKED", "COMING_SOON"];

export function VehiclesPanel() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch<{ vehicles: VehicleSummary[] }>("/api/admin/vehicles")
      .then((r) => setVehicles(r.vehicles))
      .catch((e) =>
        setStatus({ kind: "err", msg: describeError(e, "Error cargando los trucks") })
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function startNew() {
    setEditing({
      internalCode: "",
      slug: "",
      name: "",
      brand: "",
      model: new Date().getFullYear(),
      year: new Date().getFullYear(),
      type: "CLASS_C",
      status: "AVAILABLE",
      description: "",
      descriptionFr: "",
      sleepCapacity: 4,
      seatBelts: 4,
      petFriendly: false,
      pricePerNightCAD: 150,
      securityDepositCAD: 1000,
      locationId: "calgary-depot",
      mainImage: "",
      images: [],
      specs: {},
      amenities: [],
      featured: false,
      active: true,
    });
    setIsNew(true);
    setStatus(null);
  }

  async function startEdit(code: string) {
    setStatus(null);
    try {
      const r = await adminFetch<{ vehicle: Record<string, unknown> }>(
        `/api/admin/vehicles/${code}`
      );
      setEditing(r.vehicle);
      setIsNew(false);
    } catch (e) {
      setStatus({ kind: "err", msg: describeError(e, "Error cargando el truck") });
    }
  }

  function set(field: string, value: unknown) {
    setEditing((v) => (v ? { ...v, [field]: value } : v));
    setStatus(null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setStatus(null);
    try {
      const code = String(editing.internalCode).toLowerCase();
      // ADR-022: la respuesta ya no trae commitSha, solo { ok, deploy }.
      const res = await adminFetch<{ ok: boolean; deploy: "triggered" | "skipped" }>(
        isNew ? "/api/admin/vehicles" : `/api/admin/vehicles/${code}`,
        isNew
          ? { method: "POST", body: editing }
          : { method: "PUT", body: editing }
      );
      setStatus(deployMessage(res.deploy, "Truck guardado"));
      setEditing(null);
      load();
    } catch (err) {
      setStatus({
        kind: "err",
        msg:
          describeError(err, "Error al guardar") +
          (err instanceof ApiError && err.details
            ? `\n${JSON.stringify(err.details)}`
            : ""),
      });
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <VehicleForm
        vehicle={editing}
        isNew={isNew}
        onChange={set}
        onSave={save}
        onCancel={() => setEditing(null)}
        saving={saving}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Trucks ({vehicles.length})</h2>
        <button
          onClick={startNew}
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90"
        >
          + Nuevo truck
        </button>
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

      {loading ? (
        <p className="mt-6 text-neutral-500">Cargando trucks…</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {vehicles.map((v) => (
            <li
              key={v.internalCode}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {v.name}{" "}
                  <span className="ml-1 font-mono text-xs text-neutral-400">{v.internalCode}</span>
                </p>
                <p className="text-xs text-neutral-500">
                  {v.type} · ${v.pricePerNightCAD}/noche
                  {!v.active && (
                    <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-neutral-600">
                      oculto
                    </span>
                  )}
                  {v.featured && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                      destacado
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => startEdit(v.internalCode)}
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

function VehicleForm({
  vehicle,
  isNew,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  vehicle: Record<string, unknown>;
  isNew: boolean;
  onChange: (field: string, value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const specs = (vehicle.specs ?? {}) as Record<string, unknown>;

  function setSpec(field: string, value: unknown) {
    onChange("specs", { ...specs, [field]: value });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">
          {isNew ? "Nuevo truck" : `Editar ${vehicle.internalCode}`}
        </h2>
        <button
          onClick={onCancel}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          Volver
        </button>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-semibold">Identidad</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="internalCode">Código interno</label>
            <input
              id="internalCode"
              className={input}
              value={String(vehicle.internalCode ?? "")}
              onChange={(e) => onChange("internalCode", e.target.value)}
              placeholder="DC-C3-001"
            />
          </div>
          <div>
            <label className={label} htmlFor="slug">Slug (URL)</label>
            <input
              id="slug"
              className={input}
              value={String(vehicle.slug ?? "")}
              onChange={(e) => onChange("slug", e.target.value)}
              placeholder="2024-jayco-redhawk-26b"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="name">Nombre visible</label>
            <input
              id="name"
              className={input}
              value={String(vehicle.name ?? "")}
              onChange={(e) => onChange("name", e.target.value)}
            />
          </div>
          <div>
            <label className={label} htmlFor="brand">Marca</label>
            <input
              id="brand"
              className={input}
              value={String(vehicle.brand ?? "")}
              onChange={(e) => onChange("brand", e.target.value)}
            />
          </div>
          <div>
            <label className={label} htmlFor="model">Modelo</label>
            <input
              id="model"
              className={input}
              value={String(vehicle.model ?? "")}
              onChange={(e) => onChange("model", e.target.value)}
            />
          </div>
          <div>
            <label className={label} htmlFor="year">Año</label>
            <input
              id="year"
              type="number"
              className={input}
              value={Number(vehicle.year ?? 2024)}
              onChange={(e) => onChange("year", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={label} htmlFor="type">Tipo</label>
            <select
              id="type"
              className={input}
              value={String(vehicle.type ?? "CLASS_C")}
              onChange={(e) => onChange("type", e.target.value)}
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="status">Estado</label>
            <select
              id="status"
              className={input}
              value={String(vehicle.status ?? "AVAILABLE")}
              onChange={(e) => onChange("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="locationId">Depósito</label>
            <input
              id="locationId"
              className={input}
              value={String(vehicle.locationId ?? "")}
              onChange={(e) => onChange("locationId", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-semibold">Descripción</h3>
        <div className="mt-3 grid gap-4">
          <div>
            <label className={label} htmlFor="description">Descripción (EN)</label>
            <textarea
              id="description"
              rows={4}
              className={input}
              value={String(vehicle.description ?? "")}
              onChange={(e) => onChange("description", e.target.value)}
            />
          </div>
          <div>
            <label className={label} htmlFor="descriptionFr">Descripción (FR)</label>
            <textarea
              id="descriptionFr"
              rows={4}
              className={input}
              value={String(vehicle.descriptionFr ?? "")}
              onChange={(e) => onChange("descriptionFr", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-semibold">Precio y capacidad</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="pricePerNightCAD">Precio/noche (CAD)</label>
            <input
              id="pricePerNightCAD"
              type="number"
              className={input}
              value={Number(vehicle.pricePerNightCAD ?? 0)}
              onChange={(e) => onChange("pricePerNightCAD", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={label} htmlFor="securityDepositCAD">Depósito (CAD)</label>
            <input
              id="securityDepositCAD"
              type="number"
              className={input}
              value={Number(vehicle.securityDepositCAD ?? 1000)}
              onChange={(e) => onChange("securityDepositCAD", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={label} htmlFor="sleepCapacity">Camas (capacidad)</label>
            <input
              id="sleepCapacity"
              type="number"
              className={input}
              value={Number(vehicle.sleepCapacity ?? 0)}
              onChange={(e) => onChange("sleepCapacity", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={label} htmlFor="seatBelts">Cinturones</label>
            <input
              id="seatBelts"
              type="number"
              className={input}
              value={Number(vehicle.seatBelts ?? 0)}
              onChange={(e) => onChange("seatBelts", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={label} htmlFor="mainImage">Imagen principal (URL o ruta /public)</label>
            <input
              id="mainImage"
              className={input}
              value={String(vehicle.mainImage ?? "")}
              onChange={(e) => onChange("mainImage", e.target.value)}
              placeholder="/images/vehicles/DC-C3-001/exterior-01.svg"
            />
          </div>
          <div className="flex items-end gap-6 pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(vehicle.active)}
                onChange={(e) => onChange("active", e.target.checked)}
              />
              Visible
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(vehicle.featured)}
                onChange={(e) => onChange("featured", e.target.checked)}
              />
              Destacado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(vehicle.petFriendly)}
                onChange={(e) => onChange("petFriendly", e.target.checked)}
              />
              Mascotas OK
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-semibold">Especificaciones técnicas</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <SpecField label="Largo (ft)" value={specs.lengthFt} onChange={(v) => setSpec("lengthFt", v)} />
          <SpecField label="Largo (m)" value={specs.lengthM} onChange={(v) => setSpec("lengthM", Number(v))} type="number" />
          <SpecField label="Altura (ft)" value={specs.heightFt} onChange={(v) => setSpec("heightFt", v)} />
          <SpecField label="Agua fresca (gal)" value={specs.freshWaterGal} onChange={(v) => setSpec("freshWaterGal", Number(v))} type="number" />
          <SpecField label="Agua gris (gal)" value={specs.grayWaterGal} onChange={(v) => setSpec("grayWaterGal", Number(v))} type="number" />
          <SpecField label="Aguas negras (gal)" value={specs.blackWaterGal} onChange={(v) => setSpec("blackWaterGal", Number(v))} type="number" />
          <SpecField label="GVWR (lbs)" value={specs.gvwrLbs} onChange={(v) => setSpec("gvwrLbs", Number(v))} type="number" />
          <SpecField label="Chasis" value={specs.chassis} onChange={(v) => setSpec("chassis", v)} />
          <SpecField label="Motor" value={specs.engine} onChange={(v) => setSpec("engine", v)} />
          <SpecField label="Combustible" value={specs.fuelType} onChange={(v) => setSpec("fuelType", v)} />
          <SpecField label="MPG" value={specs.mpg} onChange={(v) => setSpec("mpg", v)} />
          <SpecField label="Generador (W)" value={specs.generatorWatts} onChange={(v) => setSpec("generatorWatts", Number(v))} type="number" />
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Campos técnicos adicionales se conservan tal cual en el JSON; aquí solo se
          muestran los más editados.
        </p>
      </section>

      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar truck"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-neutral-300 px-6 py-2.5 text-sm font-medium hover:bg-neutral-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function SpecField({
  label: lbl,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700">{lbl}</label>
      <input
        type={type}
        className={input}
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
