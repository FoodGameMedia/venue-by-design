import { defineConfig, devices } from "@playwright/test";
import * as path from "path";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: require.resolve("./scripts/playwright-global-setup.ts"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html"]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
    viewport: { width: 375, height: 667 },
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["iPhone SE"],
        browserName: "chromium",
        storageState: path.join(__dirname, ".auth/user.json"),
      },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  webServer: {
    command:
      "E2E_MOCK_STRIPE_CHECKOUT=1 NEXT_PUBLIC_SITE_URL=http://localhost:3001 npx next dev -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
