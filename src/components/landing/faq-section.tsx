// src/components/landing/faq-section.tsx — island (client:visible)
// Acordeón accesible nativo (<details>) — sin JS adicional (SDD §5.1).
import { t, type Locale } from "@/lib/i18n";

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
}

interface FaqSectionProps {
  locale: Locale;
  items: FaqItem[];
  maxItems?: number;
}

export function FaqSection({ locale, items, maxItems }: FaqSectionProps) {
  const visible = maxItems ? items.slice(0, maxItems) : items;

  return (
    <div className="mx-auto max-w-3xl divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
      {visible.map((item) => (
        <details key={`${item.category}-${item.id}`} className="group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-neutral-900 focus-visible:ring-2 focus-visible:ring-brand-primary [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="shrink-0 text-neutral-400 transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">{item.answer}</p>
        </details>
      ))}
      {visible.length === 0 && (
        <p className="p-5 text-sm text-neutral-500">{t(locale, "common.loading")}</p>
      )}
    </div>
  );
}

export default FaqSection;
