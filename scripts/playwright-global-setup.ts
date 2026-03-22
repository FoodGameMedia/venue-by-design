import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

export default async function globalSetup() {
  console.log("[Playwright] Global setup starting...");
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, "utf-8");
    for (const line of env.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }

  try {
    execSync("npx tsx scripts/seed-e2e-user.ts", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
  } catch {
    console.warn("Seed script failed - e2e test may fail if user/venue not set up");
  }
  console.log("[Playwright] Global setup done. Starting web server & tests...");
}
