/** @type {import('tailwindcss').Config} */
// SDD: TECHNICAL-SPEC.md §1.2 (tokens) + §6 (sistema de diseño).
// Decisión operativa (reports/decisions.md): los screens del §11.5 de
// LANDING-PAGE.md se definen como alias en `extend` para no eliminar los
// breakpoints por defecto (sm/md/lg/xl) que usan los componentes del spec.
import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1E40AF",
          secondary: "#059669",
          accent: "#D97706",
          danger: "#DC2626",
          warning: "#F59E0B",
        },
        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
        status: {
          available: "#059669",
          occupied: "#DC2626",
          maintenance: "#F59E0B",
          partial: "#D97706",
          upcoming: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      screens: {
        mobile: "0px",
        tablet: "640px",
        desktop: "1024px",
        wide: "1440px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
