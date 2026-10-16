// src/components/admin/vehicles-panel.tsx — Pestaña "Trucks" (ADR-020 + ADR-022)
// Lista los trucks de Supabase, permite crear nuevos y editar existentes.
// El formulario envía el objeto completo; el endpoint valida con vehicleSchema
// (Zod), guarda en la tabla vehicles_catalog y dispara el Deploy Hook de Vercel.
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { adminFetch, fileToBase64, ApiError } from "@/lib/admin/api-client";

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

// ─── Galería de fotos (admin) ──────────────────────────────────────
// Cada foto guarda la URL pública de Storage y los metadatos que exige
// `imageSchema` (content-schemas.ts). El frontend público
// (image-gallery.tsx) ya renderiza este array con lightbox y categorías.
const IMAGE_CATEGORIES = [
  "EXTERIOR",
  "KITCHEN",
  "BATHROOM",
  "BEDROOM",
  "LIVING",
  "FLOORPLAN",
  "DETAIL",
] as const;

/** Máximo de fotos por truck (decisión de producto). */
const MAX_GALLERY_IMAGES = 12;

interface AdminGalleryImage {
  url: string;
  alt: string;
  altFr?: string;
  category: string;
  sortOrder: number;
}

/** Lee el array `images` del vehículo de forma tolerante (puede venir vacío). */
function readImages(vehicle: Record<string, unknown>): AdminGalleryImage[] {
  const raw = vehicle.images;
  return Array.isArray(raw) ? (raw as AdminGalleryImage[]) : [];
}

/** Quita la extensión del archivo para usarla como texto alternativo inicial. */
function baseName(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, "");
}

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
        <h3 className="font-semibold">Galería de fotos</h3>
        <p className="mt-1 text-xs text-neutral-500">
          Sube varias fotos del truck (exteriores e interiores). Se publican en la
          ficha pública con lightbox y filtro por categoría. Máximo{" "}
          {MAX_GALLERY_IMAGES} fotos.
        </p>
        <GalleryManager
          images={readImages(vehicle)}
          onChange={(imgs) => onChange("images", imgs)}
          onSetMain={(url) => onChange("mainImage", url)}
          mainImage={String(vehicle.mainImage ?? "")}
        />
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

function GalleryManager({
  images,
  onChange,
  onSetMain,
  mainImage,
}: {
  images: AdminGalleryImage[];
  onChange: (imgs: AdminGalleryImage[]) => void;
  onSetMain: (url: string) => void;
  mainImage: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "warn" | "err"; msg: string } | null>(null);

  /** Reconsecuencia el sortOrder según el índice tras mover/borrar. */
  function withOrder(imgs: AdminGalleryImage[]): AdminGalleryImage[] {
    return imgs.map((img, i) => ({ ...img, sortOrder: i }));
  }

  function update(index: number, patch: Partial<AdminGalleryImage>) {
    const next = images.map((img, i) => (i === index ? { ...img, ...patch } : img));
    onChange(next);
    setMsg(null);
  }

  function remove(index: number) {
    onChange(withOrder(images.filter((_, i) => i !== index)));
    setMsg(null);
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(withOrder(next));
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // Permite volver a elegir el mismo archivo tras un error
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = MAX_GALLERY_IMAGES - images.length;
    if (remaining <= 0) {
      setMsg({ kind: "err", msg: `Máximo ${MAX_GALLERY_IMAGES} fotos por truck.` });
      return;
    }
    const toUpload = files.slice(0, remaining);
    const skipped = files.length - toUpload.length;

    setUploading(true);
    setMsg(null);
    const uploaded: AdminGalleryImage[] = [];
    try {
      for (const file of toUpload) {
        const base64 = await fileToBase64(file);
        // ADR-022: la respuesta trae la URL PÚBLICA de Storage (`url`).
        const res = await adminFetch<{ url: string }>("/api/admin/upload", {
          method: "POST",
          body: { name: file.name, dataBase64: base64 },
        });
        uploaded.push({
          url: res.url,
          alt: baseName(file.name),
          altFr: "",
          // Decisión: EXTERIOR por defecto, editable con el desplegable.
          category: "EXTERIOR",
          sortOrder: images.length + uploaded.length,
        });
      }
      onChange([...images, ...uploaded]);

      if (skipped > 0) {
        setMsg({
          kind: "warn",
          msg: `Subidas ${uploaded.length} fotos. Se ignoraron ${skipped} para no superar el límite de ${MAX_GALLERY_IMAGES}.`,
        });
      } else {
        setMsg({ kind: "ok", msg: `${uploaded.length} foto(s) subida(s). Recuerda pulsar "Guardar truck".` });
      }
    } catch (err) {
      // Conservamos las fotos ya subidas en esta tanda para no perderlas.
      if (uploaded.length > 0) onChange([...images, ...uploaded]);
      setMsg({
        kind: "err",
        msg:
          (err instanceof ApiError ? err.message : "Error al subir la imagen") +
          (uploaded.length > 0 ? ` (${uploaded.length} fotos sí se subieron.)` : ""),
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-3">
      {/* Botón de subida + contador */}
      <div className="flex items-center justify-between gap-3">
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 ${
            images.length >= MAX_GALLERY_IMAGES ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
            multiple
            className="sr-only"
            disabled={uploading || images.length >= MAX_GALLERY_IMAGES}
            onChange={handleUpload}
          />
          {uploading ? "Subiendo…" : "＋ Subir fotos"}
        </label>
        <span className="text-xs text-neutral-500">
          {images.length} / {MAX_GALLERY_IMAGES}
        </span>
      </div>

      {msg && (
        <p
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            msg.kind === "ok"
              ? "bg-green-50 text-green-800"
              : msg.kind === "warn"
                ? "bg-amber-50 text-amber-800"
                : "bg-red-50 text-red-700"
          }`}
        >
          {msg.msg}
        </p>
      )}

      {/* Lista de fotos */}
      {images.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-400">
          Sin fotos todavía. Sube varias imágenes para que el cliente vea el truck
          desde varios puntos de vista.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {images.map((img, index) => (
            <li
              key={img.url + index}
              className="flex flex-wrap items-start gap-3 rounded-lg border border-neutral-200 p-3"
            >
              <img
                src={img.url}
                alt={img.alt}
                className="h-16 w-24 shrink-0 rounded-md border border-neutral-200 object-cover"
              />
              <div className="grid min-w-[220px] flex-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-500" htmlFor={`alt-${index}`}>
                    Texto alt (EN)
                  </label>
                  <input
                    id={`alt-${index}`}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                    value={img.alt ?? ""}
                    onChange={(e) => update(index, { alt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500" htmlFor={`altFr-${index}`}>
                    Texto alt (FR)
                  </label>
                  <input
                    id={`altFr-${index}`}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                    value={img.altFr ?? ""}
                    onChange={(e) => update(index, { altFr: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500" htmlFor={`cat-${index}`}>
                    Categoría
                  </label>
                  <select
                    id={`cat-${index}`}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                    value={img.category}
                    onChange={(e) => update(index, { category: e.target.value })}
                  >
                    {IMAGE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Acciones */}
              <div className="flex shrink-0 flex-col gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Mover antes"
                    className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label="Mover después"
                    className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 disabled:opacity-40"
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onSetMain(img.url)}
                  className={`rounded border px-2 py-1 text-xs ${
                    mainImage === img.url
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-neutral-300 hover:bg-neutral-100"
                  }`}
                >
                  {mainImage === img.url ? "✓ Principal" : "Hacer principal"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
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
