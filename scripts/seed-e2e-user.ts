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

  // 4. Give it a live plan.
  //
  // Systems is gated on the subscription from D24, and without a row here the
  // test account resolves to `free` and loses the whole module, which makes it
  // useless for walking anything. Group rather than Pro, so one account can
  // reach every tier's features. The Stripe ids are obvious fakes: nothing
  // reads them, the gate reads `plan` and `status`.
  const { data: existingSubs } = await supabase
    .from("subscriptions")
    .select("id, plan, status")
    .eq("user_id", userId);

  const live = existingSubs?.find((s) =>
    ["trialing", "active", "past_due"].includes(s.status as string)
  );

  if (live) {
    if (live.plan !== "group") {
      await supabase
        .from("subscriptions")
        .update({
          plan: "group",
          metadata: {
            synthetic: true,
            reason:
              "Seeded so the e2e test account can reach gated features. Not a customer. Exclude from every revenue and customer count.",
            stamped_at: new Date().toISOString(),
          },
        })
        .eq("id", live.id);
      console.log(`Raised the e2e subscription from ${live.plan} to group`);
    }
  } else {
    const { error } = await supabase.from("subscriptions").insert({
      user_id: userId,
      stripe_subscription_id: `sub_e2e_${userId}`,
      stripe_customer_id: `cus_e2e_${userId}`,
      stripe_price_id: "price_e2e_group",
      plan: "group",
      status: "active",
      // Stamped at birth. Stripe has never heard of this row, and anything that
      // counts customers or revenue must exclude it. See
      // scripts/flag-synthetic-subscriptions.ts.
      metadata: {
        synthetic: true,
        reason:
          "Seeded so the e2e test account can reach gated features. Not a customer. Exclude from every revenue and customer count.",
        stamped_at: new Date().toISOString(),
      },
    });
    if (error) {
      console.error("Failed to insert subscription:", error);
      process.exit(1);
    }
    console.log("Created a Group subscription so the e2e account can reach Systems");
  }

  console.log("E2E setup complete. Email:", email);
}

main().catch(console.error);
