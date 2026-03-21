import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "e2e@venuebydesign.test";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "e2etestpass123";

test.describe("Check-in flow", () => {
  test("completes full check-in from login to Calm Index result", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("link", { name: "Weekly check-in" }).click();
    await expect(page).toHaveURL(/\/checkin/);

    for (let i = 0; i < 7; i++) {
      await page.getByTestId("score-2").click();
      await page.getByTestId("next-btn").click();
    }

    await expect(page.getByTestId("calm-index-result")).toBeVisible();
    const calmIndexText = await page.getByTestId("calm-index-result").textContent();
    const calmIndex = parseFloat(calmIndexText ?? "0");
    expect(calmIndex).toBeGreaterThanOrEqual(0);
    expect(calmIndex).toBeLessThanOrEqual(10);
  });
});
