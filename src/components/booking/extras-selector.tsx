// src/components/booking/extras-selector.tsx — Selección de extras
import { EXTRAS_CATALOG, formatCAD } from "@/lib/pricing";
import type { ExtraSelection } from "@/stores/booking-store";
import { t, type Locale } from "@/lib/i18n";

interface ExtrasSelectorProps {
  locale: Locale;
  selected: ExtraSelection[];
  onToggle: (id: string) => void;
}

export function ExtrasSelector({ locale, selected, onToggle }: ExtrasSelectorProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-neutral-800">{t(locale, "booking.extras")}</legend>
      {EXTRAS_CATALOG.map((extra) => {
        const isSelected = selected.some((e) => e.id === extra.id);
        return (
          <label
            key={extra.id}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(extra.id)}
                className="h-4 w-4 rounded border-neutral-300 accent-brand-primary"
              />
              {locale === "fr" ? extra.nameFr : extra.name}
              {extra.perDay && <span className="text-xs text-neutral-400">/night</span>}
            </span>
            <span className="font-mono text-xs text-neutral-600">
              {formatCAD(extra.priceCAD, locale)}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

export default ExtrasSelector;
