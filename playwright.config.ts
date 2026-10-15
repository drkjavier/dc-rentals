// playwright.config.ts — E2E smoke (SDD §15.1)
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  webServer: {
    // astro preview no está soportado con el adaptador de Vercel; el dev server
    // ejecuta tanto las páginas SSG como los endpoints serverless.
    command: "npm run dev",
    port: 4321,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
