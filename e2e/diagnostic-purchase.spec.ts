import { test, expect } from "@playwright/test";

test.describe("Deep Diagnostic purchase flow", () => {
  test("records Solo purchase and reaches diagnostic form", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto("/pricing");
    await expect(page).toHaveURL(/\/pricing/, { timeout: 10_000 });

    await page.getByRole("button", { name: "Book now" }).first().click();

    await expect(page).toHaveURL(/\/diagnostic/, { timeout: 15_000 });

    await expect(page.getByText("Throughput", { exact: true })).toBeVisible({ timeout: 10_000 });
  });
});
