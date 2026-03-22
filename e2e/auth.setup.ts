import { test as setup } from "@playwright/test";
import * as path from "path";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "e2e@venuebydesign.test";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "e2etestpass123";
const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 20_000 });
  await page.context().storageState({ path: authFile });
});
