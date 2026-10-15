// postcss.config.mjs — Tailwind vía PostCSS (ADR-012)
// Sustituye a @astrojs/tailwind (incompatible con Astro 4.16).
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
