import { test, expect } from "@playwright/test";

test.describe("Check-in flow", () => {
  test("completes full check-in from login to Calm Index result and dashboard updates", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    await page.getByRole("link", { name: /Weekly check-in|Start your first check-in/ }).first().click();
    await expect(page).toHaveURL(/\/checkin/, { timeout: 10_000 });

    for (let i = 0; i < 7; i++) {
      await page.getByTestId("score-2").click();
      await page.getByTestId("next-btn").click();
    }

    const result = page.getByTestId("calm-index-result");
    await expect(result).toBeVisible({ timeout: 15_000 });
    const calmIndexText = await result.textContent();
    const calmIndex = parseFloat(calmIndexText ?? "0");
    expect(calmIndex).toBeGreaterThanOrEqual(0);
    expect(calmIndex).toBeLessThanOrEqual(10);

    await page.getByRole("link", { name: "Back to dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    const dashboardCalmIndex = page.getByTestId("dashboard-calm-index");
    await expect(dashboardCalmIndex).toBeVisible({ timeout: 5_000 });
    await expect(dashboardCalmIndex).toContainText(String(calmIndex));

    const historyScore = page.getByTestId("checkin-history-score").first();
    await expect(historyScore).toBeVisible({ timeout: 5_000 });
    await expect(historyScore).toContainText(String(calmIndex));
  });
});
