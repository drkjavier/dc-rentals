// tests/e2e/smoke.spec.ts — Smoke E2E de la landing y la ficha de vehículo
import { test, expect } from "@playwright/test";

test("landing renders hero and featured fleet", async ({ page }) => {
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { level: 1, name: "Explore Canada in Your Home on Wheels" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /View Available Fleet/i }).first()).toBeVisible();
});

test("fleet catalog lists vehicles and filters render", async ({ page }) => {
  await page.goto("/en/vehicles");
  await expect(page.getByRole("heading", { level: 1, name: "Our Fleet" })).toBeVisible();
  await expect(page.locator("[data-vehicle-card]")).toHaveCount(4);
  await expect(page.getByLabel("Vehicle type")).toBeVisible();
});

test("vehicle detail shows specs and booking widget", async ({ page }) => {
  await page.goto("/en/vehicles/2024-jayco-redhawk-26b");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Jayco Redhawk");
  await expect(page.getByRole("button", { name: /Request Reservation/i })).toBeVisible();
  await expect(page.getByText("Ford E-450").first()).toBeVisible();
});

test("french locale works at /fr/vehicules", async ({ page }) => {
  await page.goto("/fr/vehicules");
  await expect(page.getByRole("heading", { level: 1, name: "Notre flotte" })).toBeVisible();
});

test("unknown route returns 404", async ({ page }) => {
  const response = await page.goto("/en/no-existe");
  expect(response?.status()).toBe(404);
});
