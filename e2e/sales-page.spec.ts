import { test, expect } from "@playwright/test";

test.describe("Public sales page", () => {
  test("renders hero and links to pricing and diagnostic flow", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("sales-hero-headline")).toBeVisible();
    await expect(page.getByTestId("sales-hero-thermostat")).toBeVisible();
    await expect(page.getByTestId("sales-hero-glow")).toBeAttached();
    await expect(page.getByTestId("sales-cta-get-started")).toHaveAttribute(
      "href",
      "/pricing?diagnostic=required"
    );
    await expect(page.getByTestId("sales-cta-get-started")).toHaveText("Get started");
    await expect(page.getByTestId("sales-cta-pricing")).toHaveAttribute("href", "/pricing");
    await expect(page.getByTestId("sales-cta-how-it-works")).toHaveAttribute("href", "#loop");
    await expect(page.getByTestId("header-cta-diagnostic")).toHaveAttribute(
      "href",
      "/pricing?diagnostic=required"
    );
    await expect(page.getByTestId("header-cta-pricing")).toHaveAttribute("href", "/pricing");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Advisor Portal" })).toBeVisible();
    await expect(page.getByTestId("sales-social-proof")).toHaveCount(0);
  });

  test("renders enhancements: commitment, final CTA, domains, glows", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("sales-commitment-section")).toBeVisible();
    await expect(page.getByTestId("sales-final-cta-heading")).toHaveText(
      "Commit to the next ninety days."
    );
    await expect(page.getByTestId("sales-domain-icons").locator("li")).toHaveCount(7);
    await expect(page.getByTestId("sales-quiet-advantage-glow")).toBeAttached();
    await page.getByRole("heading", { name: "The quiet advantage" }).scrollIntoViewIfNeeded();
    await expect(page.getByTestId("sales-quiet-advantage-glow")).toBeAttached();
  });
});
