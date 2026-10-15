import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// SDD: TECHNICAL-SPEC.md §15.1 — Vitest con entorno node para lógica pura.
// Los tests de islands React usan el pragma `@vitest-environment jsdom`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true, // habilita auto-cleanup de @testing-library/react (afterEach)
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
    },
  },
});
