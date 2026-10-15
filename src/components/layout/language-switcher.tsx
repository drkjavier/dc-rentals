// src/components/layout/language-switcher.tsx — island (client:load)
// SDD §5.1 — toggle EN/FR que preserva la ruta localizada.
import { swapLocalePath, localeConfig, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  locale: Locale;
  pathname: string;
  class?: string;
}

export function LanguageSwitcher({ locale, pathname, class: className }: LanguageSwitcherProps) {
  const alternate = swapLocalePath(pathname);

  return (
    <div
      className={cn("flex items-center gap-1 rounded-lg border border-neutral-200 p-0.5", className)}
      role="group"
      aria-label="Language"
    >
      {(["en", "fr"] as const).map((lang) => {
        const isActive = lang === locale;
        const href = isActive ? pathname : alternate ?? `/${lang}`;
        return (
          <a
            key={lang}
            href={href}
            hrefLang={lang === "fr" ? "fr-CA" : "en-CA"}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-150",
              "focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1",
              isActive
                ? "bg-brand-primary text-white"
                : "text-neutral-600 hover:text-brand-primary"
            )}
          >
            {localeConfig[lang].name}
          </a>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
