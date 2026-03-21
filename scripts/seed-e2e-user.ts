/**
 * Creates the e2e test user and venue.
 * Run: npx tsx scripts/seed-e2e-user.ts
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";

const email = process.env.E2E_TEST_EMAIL ?? "e2e@venuebydesign.test";
const password = process.env.E2E_TEST_PASSWORD ?? "e2etestpass123";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !serviceKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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

  if (!dbUrl) {
    console.log("DATABASE_URL not set, skipping venue seed");
    return;
  }

  const sql = postgres(dbUrl, { prepare: false });
  const db = drizzle(sql, { schema });

  let dbUser = await db.query.users.findFirst({
    where: eq(schema.users.authId, authId!),
  });

  if (!dbUser) {
    const [inserted] = await db
      .insert(schema.users)
      .values({ authId: authId!, email, fullName: "E2E Test User" })
      .returning();
    dbUser = inserted;
  }

  if (!dbUser) {
    console.error("Failed to get/create db user");
    process.exit(1);
  }

  const existingVenues = await db.query.venues.findMany({
    where: eq(schema.venues.userId, dbUser!.id),
  });

  if (existingVenues.length === 0) {
    await db.insert(schema.venues).values({
      userId: dbUser.id,
      name: "E2E Test Venue",
      status: "active",
    });
    console.log("Created venue");
  }

  console.log("E2E setup complete. Email:", email);
}

main().catch(console.error);
