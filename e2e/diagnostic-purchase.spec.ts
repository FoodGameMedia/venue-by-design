import { test, expect } from "@playwright/test";

test.describe("Deep Diagnostic purchase flow", () => {
  test("purchases Solo plan and reaches diagnostic form", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/pricing");
    await expect(page).toHaveURL(/\/pricing/, { timeout: 10_000 });

    await page.getByRole("button", { name: "Book now" }).first().click();

    await expect(page).toHaveURL(/checkout\.stripe\.com|stripe\.com/, { timeout: 15_000 });

    const cardFrame = page.frameLocator('iframe[title*="card number" i]').first();
    await cardFrame.locator('input[name="cardnumber"], input').fill("4242424242424242");
    const expFrame = page.frameLocator('iframe[title*="expir" i]').first();
    await expFrame.locator('input[name="exp-date"], input').fill("12/30");
    const cvcFrame = page.frameLocator('iframe[title*="cvc" i]').first();
    await cvcFrame.locator('input[name="cvc"], input').fill("123");

    await page.getByRole("button", { name: /Pay|Subscribe/ }).click();

    await expect(page).toHaveURL(/\/diagnostic/, { timeout: 30_000 });

    await expect(page.getByText(/Domain 1 of 7|Deep Diagnostic|Throughput/)).toBeVisible({
      timeout: 10_000,
    });
  });
});
