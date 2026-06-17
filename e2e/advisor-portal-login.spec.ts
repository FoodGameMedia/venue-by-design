import { test, expect } from "@playwright/test";

test.describe("Advisor Portal sign in", () => {
  test("shows explainer card for advisor login", async ({ page }) => {
    await page.goto("/login?redirectTo=/advisor");
    await expect(page.getByTestId("advisor-portal-explainer")).toBeVisible();
    await expect(page.getByRole("heading", { name: "For the people around your venue" })).toBeVisible();
    await expect(page.getByText("Advisor Portal sign in")).toBeVisible();
    await expect(page.getByText("Venue operators")).toBeVisible();
    await expect(page.getByText("Multi-site owners")).toBeVisible();
    await expect(page.getByText("Advisors and consultants")).toBeVisible();
  });

  test("hides explainer on standard operator login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("advisor-portal-explainer")).toHaveCount(0);
  });
});
