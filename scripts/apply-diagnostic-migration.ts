/**
 * Apply diagnostic tables migration directly.
 * Use if drizzle-kit migrate didn't create diagnostic_purchases.
 * Run: npx tsx scripts/apply-diagnostic-migration.ts
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "diagnostic_purchases" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
      "stripe_payment_intent_id" text,
      "stripe_session_id" text,
      "plan" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  console.log("Created diagnostic_purchases");

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "diagnostics" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "venue_id" uuid NOT NULL REFERENCES "public"."venues"("id") ON DELETE cascade,
      "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
      "responses" jsonb NOT NULL,
      "calm_index" real,
      "report_raw" jsonb,
      "report_pdf_path" text,
      "email_sent_at" timestamp with time zone,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  console.log("Created diagnostics");

  await sql.end();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
