// src/components/shared/image-gallery.tsx — island (client:visible)
// Galería con lightbox navegable (AGENT-TEAM-SPEC §3.5, AC de galería):
// ←/→ teclado, Esc cierra, rail de miniaturas, contador, filtro por categoría,
// preload de adyacentes, role="dialog" + focus devuelto al cerrar.
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  url: string;
  alt: string;
  category: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  locale: Locale;
}

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  EXTERIOR: "vehicle.exterior",
  KITCHEN: "vehicle.kitchen",
  BATHROOM: "vehicle.bathroom",
  BEDROOM: "vehicle.bedroom",
  LIVING: "vehicle.living",
  FLOORPLAN: "vehicle.floorplan_title",
  DETAIL: "vehicle.specs_title",
};

export function ImageGallery({ images, locale }: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => a.category.localeCompare(b.category));
  const [category, setCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const visible = category ? sorted.filter((img) => img.category === category) : sorted;
  const current = visible[Math.min(currentIndex, visible.length - 1)];

  const categories = Array.from(new Set(sorted.map((img) => img.category)));

  const openLightbox = (index: number, opener: HTMLButtonElement) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    openerRef.current = opener;
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    openerRef.current?.focus();
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % visible.length);
  }, [visible.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + visible.length) % visible.length);
  }, [visible.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, closeLightbox, goNext, goPrev]);

  // Preload de imágenes adyacentes (nav sin flash)
  useEffect(() => {
    if (!lightboxOpen || visible.length < 2) return;
    const next = visible[(currentIndex + 1) % visible.length];
    const prev = visible[(currentIndex - 1 + visible.length) % visible.length];
    const nextImg = new window.Image();
    nextImg.src = next.url;
    const prevImg = new window.Image();
    prevImg.src = prev.url;
  }, [lightboxOpen, currentIndex, visible]);

  return (
    <section aria-label={t(locale, "vehicle.gallery_title")}>
      {/* Imagen principal */}
      <div className="relative overflow-hidden rounded-xl bg-neutral-100">
        <img
          src={current.url}
          alt={current.alt}
          width="1200"
          height="800"
          className="aspect-[3/2] w-full object-cover"
        />
        <button
          type="button"
          onClick={(e) => openLightbox(currentIndex, e.currentTarget)}
          aria-label={current.alt}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-neutral-900/70 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-900 focus-visible:ring-2 focus-visible:ring-white"
        >
          <Maximize2 size={14} aria-hidden="true" />
          {t(locale, "common.see_all")}
        </button>
        <p className="absolute bottom-3 left-3 rounded-lg bg-neutral-900/70 px-2.5 py-1 font-mono text-xs text-white">
          {currentIndex + 1} / {visible.length}
        </p>
      </div>

      {/* Filtro por categoría */}
      {categories.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t(locale, "vehicle.gallery_title")}>
          <button
            type="button"
            onClick={() => {
              setCategory(null);
              setCurrentIndex(0);
            }}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              category === null
                ? "bg-brand-primary text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {t(locale, "common.see_all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                setCurrentIndex(0);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                category === cat
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {t(locale, CATEGORY_LABEL_KEYS[cat] ?? "vehicle.specs_title")}
            </button>
          ))}
        </div>
      )}

      {/* Rail de miniaturas */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="list">
        {visible.map((img, index) => (
          <button
            key={img.url}
            type="button"
            role="listitem"
            onClick={(e) => {
              setCurrentIndex(index);
              openLightbox(index, e.currentTarget);
            }}
            aria-label={img.alt}
            aria-current={index === currentIndex}
            className={cn(
              "h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2",
              index === currentIndex ? "border-brand-primary" : "border-transparent"
            )}
          >
            <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          onClick={closeLightbox}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/90 p-4 motion-safe:animate-in motion-safe:fade-in"
        >
          <div className="relative max-h-full w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button
              ref={closeRef}
              type="button"
              onClick={closeLightbox}
              aria-label={t(locale, "common.close")}
              className="absolute -top-12 right-0 rounded-lg bg-white/10 p-2 text-white hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
            >
              <X size={20} aria-hidden="true" />
            </button>

            <img
              src={current.url}
              alt={current.alt}
              className="mx-auto max-h-[75vh] w-auto rounded-lg object-contain motion-safe:transition-transform motion-safe:duration-200"
            />
            <p className="mt-3 text-center text-sm text-neutral-300">
              {current.alt} — {currentIndex + 1} / {visible.length}
            </p>

            {visible.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={t(locale, "calendar.prev_month")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronLeft size={24} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={t(locale, "calendar.next_month")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronRight size={24} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default ImageGallery;
