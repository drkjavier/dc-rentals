// src/components/layout/mobile-nav.tsx — island (client:load)
// Menú móvil accesible: aria-expanded, cierre con Esc, foco controlado.
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
}

interface MobileNavProps {
  items: NavItem[];
  cta: NavItem;
  labels: { open: string; close: string; menu: string };
}

export function MobileNav({ items, cta, labels }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "rounded-lg p-2 text-neutral-700 hover:bg-neutral-100",
          "focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        )}
      >
        {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>

      {open && (
        <div
          id="mobile-nav-panel"
          ref={panelRef}
          role="dialog"
          aria-label={labels.menu}
          className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg"
        >
          <nav aria-label={labels.menu} className="flex flex-col gap-1">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-brand-primary",
                  "focus-visible:ring-2 focus-visible:ring-brand-primary"
                )}
              >
                {item.label}
              </a>
            ))}
            <a
              href={cta.href}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-brand-primary px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800"
            >
              {cta.label}
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}

export default MobileNav;
