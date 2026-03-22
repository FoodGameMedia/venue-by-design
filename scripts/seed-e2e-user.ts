/**
 * Creates the e2e test user and venue.
 * Uses Supabase client (HTTPS) instead of direct Postgres — works when port 5432 is blocked.
 * Run: npx tsx scripts/seed-e2e-user.ts
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";

const email = process.env.E2E_TEST_EMAIL ?? "e2e@venuebydesign.test";
const password = process.env.E2E_TEST_PASSWORD ?? "e2etestpass123";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Create or update auth user
  const { data: list } = await supabase.auth.admin.listUsers();
  let authId = list?.users?.find((u) => u.email === email)?.id;

  if (authId) {
    await supabase.auth.admin.updateUserById(authId, { password });
    console.log("Updated password for existing e2e user");
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      console.error("Failed to create user:", error);
      process.exit(1);
    }
    authId = created.user?.id;
    console.log("Created e2e user:", authId);
  }

  // 2. Upsert users table (via Supabase REST API — no direct Postgres needed)
  const { data: existingUsers } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authId)
    .limit(1);

  let userId: string;

  if (existingUsers?.length) {
    userId = existingUsers[0].id;
  } else {
    const { data: inserted, error } = await supabase
      .from("users")
      .insert({ auth_id: authId, email, full_name: "E2E Test User" })
      .select("id")
      .single();
    if (error) {
      console.error("Failed to insert user:", error);
      process.exit(1);
    }
    userId = inserted.id;
  }

  // 3. Create venue if not exists
  const { data: existingVenues } = await supabase
    .from("venues")
    .select("id")
    .eq("user_id", userId);

  if (!existingVenues?.length) {
    const { error } = await supabase.from("venues").insert({
      user_id: userId,
      name: "E2E Test Venue",
      status: "active",
    });
    if (error) {
      console.error("Failed to insert venue:", error);
      process.exit(1);
    }
    console.log("Created venue");
  }

  console.log("E2E setup complete. Email:", email);
}

main().catch(console.error);
