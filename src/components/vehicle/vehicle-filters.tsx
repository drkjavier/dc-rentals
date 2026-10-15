// src/components/vehicle/vehicle-filters.tsx — island (client:visible)
// Filtros y orden del catálogo. Opera sobre las tarjetas SSR (data-attrs),
// sin fetch adicional: el HTML del catálogo sigue siendo indexable (cero JS).
import { useEffect } from "react";
import { useFilterStore, type SortBy } from "@/stores/filter-store";
import { TYPE_LABELS } from "@/lib/vehicle-labels";
import { LOCATIONS } from "@/lib/locations";
import { t, type Locale } from "@/lib/i18n";

const TYPE_OPTIONS = [
  "CLASS_A",
  "CLASS_B",
  "CLASS_C",
  "TRAVEL_TRAILER",
  "FIFTH_WHEEL",
  "TRUCK_CAMPER",
  "CAMPER_VAN",
] as const;

const SORT_OPTIONS: Array<{ value: SortBy; labelKey: string }> = [
  { value: "recommended", labelKey: "catalog.sort_recommended" },
  { value: "price_asc", labelKey: "catalog.sort_price_asc" },
  { value: "price_desc", labelKey: "catalog.sort_price_desc" },
  { value: "length_desc", labelKey: "catalog.sort_length_desc" },
];

interface Props {
  locale: Locale;
}

export function VehicleFilters({ locale }: Props) {
  const { type, sleepCapacity, maxPrice, locationId, petFriendly, sortBy, setFilter, resetFilters } =
    useFilterStore();

  useEffect(() => {
    const grid = document.getElementById("vehicle-grid");
    if (!grid) return;
    const cards = Array.from(
      grid.querySelectorAll<HTMLElement>("[data-vehicle-card]")
    );

    let visible = 0;
    const ordered = [...cards].sort((a, b) => {
      const da = a.dataset;
      const db = b.dataset;
      switch (sortBy) {
        case "price_asc":
          return Number(da.price) - Number(db.price);
        case "price_desc":
          return Number(db.price) - Number(da.price);
        case "length_desc":
          return Number(db.length) - Number(db.length);
        default:
          // recommended: destacados primero, luego por nombre
          return (
            Number(db.featured) - Number(da.featured) ||
            (da.name ?? "").localeCompare(db.name ?? "")
          );
      }
    });

    ordered.forEach((card, index) => {
      const d = card.dataset;
      const matches =
        (!type || d.type === type) &&
        (!sleepCapacity || Number(d.sleep) === sleepCapacity) &&
        (!maxPrice || Number(d.price) <= maxPrice) &&
        (!locationId || d.location === locationId) &&
        (petFriendly === null || d.pet === String(petFriendly));

      card.style.order = String(index);
      card.classList.toggle("hidden", !matches);
      if (matches) visible += 1;
    });

    const countEl = document.getElementById("results-count");
    if (countEl) countEl.textContent = t(locale, "catalog.results_count", { count: visible });

    const emptyEl = document.getElementById("filters-empty-state");
    if (emptyEl) emptyEl.classList.toggle("hidden", visible > 0);
  }, [type, sleepCapacity, maxPrice, locationId, petFriendly, sortBy, locale]);

  useEffect(() => {
    const resetBtn = document.getElementById("filters-reset");
    if (!resetBtn) return;
    const onClick = () => resetFilters();
    resetBtn.addEventListener("click", onClick);
    return () => resetBtn.removeEventListener("click", onClick);
  }, [resetFilters]);

  const controlClass =
    "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary";

  return (
    <form
      aria-label={t(locale, "catalog.filters")}
      onSubmit={(e) => e.preventDefault()}
      className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5"
    >
      <p className="font-heading text-base font-bold text-neutral-900">
        {t(locale, "catalog.filters")}
      </p>

      <div>
        <label htmlFor="filter-type" className="text-sm font-medium text-neutral-700">
          {t(locale, "catalog.filter_type")}
        </label>
        <select
          id="filter-type"
          className={controlClass}
          value={type ?? ""}
          onChange={(e) => setFilter("type", e.target.value || null)}
        >
          <option value="">{t(locale, "catalog.filter_any")}</option>
          {TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {TYPE_LABELS[locale][option]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-sleep" className="text-sm font-medium text-neutral-700">
          {t(locale, "catalog.filter_sleep")}
        </label>
        <select
          id="filter-sleep"
          className={controlClass}
          value={sleepCapacity ?? ""}
          onChange={(e) =>
            setFilter("sleepCapacity", e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">{t(locale, "catalog.filter_any")}</option>
          {[2, 4, 6, 8].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-location" className="text-sm font-medium text-neutral-700">
          {t(locale, "catalog.filter_location")}
        </label>
        <select
          id="filter-location"
          className={controlClass}
          value={locationId ?? ""}
          onChange={(e) => setFilter("locationId", e.target.value || null)}
        >
          <option value="">{t(locale, "catalog.filter_any")}</option>
          {LOCATIONS.map((location) => (
            <option key={location.id} value={location.id}>
              {location.city}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-price" className="text-sm font-medium text-neutral-700">
          {t(locale, "catalog.filter_price")}
        </label>
        <input
          id="filter-price"
          type="range"
          min={100}
          max={350}
          step={10}
          value={maxPrice ?? 350}
          onChange={(e) =>
            setFilter("maxPrice", Number(e.target.value) >= 350 ? null : Number(e.target.value))
          }
          className="mt-2 w-full accent-brand-primary"
        />
        <p className="mt-1 text-xs text-neutral-500">
          ≤ {maxPrice ?? 350} CAD
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
        <input
          type="checkbox"
          checked={petFriendly === true}
          onChange={(e) => setFilter("petFriendly", e.target.checked ? true : null)}
          className="h-4 w-4 rounded border-neutral-300 accent-brand-primary"
        />
        {t(locale, "catalog.filter_pet")}
      </label>

      <div>
        <label htmlFor="filter-sort" className="text-sm font-medium text-neutral-700">
          {t(locale, "catalog.sort")}
        </label>
        <select
          id="filter-sort"
          className={controlClass}
          value={sortBy}
          onChange={(e) => setFilter("sortBy", e.target.value as SortBy)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(locale, option.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        {t(locale, "catalog.reset_filters")}
      </button>
    </form>
  );
}

export default VehicleFilters;
