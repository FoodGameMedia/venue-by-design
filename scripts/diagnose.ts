#!/usr/bin/env npx tsx
/**
 * Diagnostic script: tests auth, API, env.
 * Run: npx tsx scripts/diagnose.ts
 */
import "dotenv/config";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local", override: true });

const EMAIL = process.env.E2E_TEST_EMAIL ?? "e2e@venuebydesign.test";
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? "e2etestpass123";

const results: { check: string; ok: boolean; detail: string }[] = [];

function pass(check: string, detail: string) {
  results.push({ check, ok: true, detail });
}

function fail(check: string, detail: string) {
  results.push({ check, ok: false, detail });
}

async function main() {
  console.log("\n=== Venue by Design Diagnostic ===\n");

  // 1. Env vars
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    fail("Env: NEXT_PUBLIC_SUPABASE_URL", "Missing");
  } else {
    pass("Env: NEXT_PUBLIC_SUPABASE_URL", url.slice(0, 40) + "...");
  }

  if (!anonKey) {
    fail("Env: NEXT_PUBLIC_SUPABASE_ANON_KEY", "Missing");
  } else {
    pass("Env: NEXT_PUBLIC_SUPABASE_ANON_KEY", "Set");
  }

  if (!serviceKey) {
    fail("Env: SUPABASE_SERVICE_ROLE_KEY", "Missing");
  } else {
    pass("Env: SUPABASE_SERVICE_ROLE_KEY", "Set");
  }

  if (!url || !serviceKey) {
    printResults();
    process.exit(1);
  }

  // 2. Supabase Auth (signIn)
  const authClient = createClient(url, anonKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data, error } = await authClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    if (error) {
      fail("Auth: signInWithPassword", error.message);
    } else if (data?.user) {
      pass("Auth: signInWithPassword", `OK (user: ${data.user.id.slice(0, 8)}...)`);
    } else {
      fail("Auth: signInWithPassword", "No user returned");
    }
  } catch (e) {
    fail("Auth: signInWithPassword", String(e));
  }

  // 3. Supabase REST - users (service role)
  const adminClient = createClient(url, serviceKey);

  try {
    const { data: users, error } = await adminClient
      .from("users")
      .select("id")
      .eq("email", EMAIL)
      .limit(1);

    if (error) {
      fail("REST: users table", error.message);
    } else if (users?.length) {
      pass("REST: users table", `OK (found user ${users[0].id.slice(0, 8)}...)`);
    } else {
      fail("REST: users table", `No user with email ${EMAIL}. Run: npx tsx scripts/seed-e2e-user.ts`);
    }
  } catch (e) {
    fail("REST: users table", String(e));
  }

  // 4. Supabase REST - venues (service role)
  try {
    const { data: users } = await adminClient.from("users").select("id").eq("email", EMAIL).limit(1);
    if (users?.length) {
      const { data: venues, error } = await adminClient
        .from("venues")
        .select("id, name")
        .eq("user_id", users[0].id);

      if (error) {
        fail("REST: venues table", error.message);
      } else if (venues?.length) {
        pass("REST: venues table", `OK (${venues.length} venue(s): ${venues.map((v) => v.name).join(", ")})`);
      } else {
        fail("REST: venues table", "No venues for e2e user. Run: npx tsx scripts/seed-e2e-user.ts");
      }
    }
  } catch (e) {
    fail("REST: venues table", String(e));
  }

  printResults();
}

function printResults() {
  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.filter((r) => !r.ok).length;

  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    const color = r.ok ? "\x1b[32m" : "\x1b[31m";
    console.log(`${color}${icon}\x1b[0m ${r.check}: ${r.detail}`);
  }

  console.log(`\n--- ${okCount} passed, ${failCount} failed ---\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
