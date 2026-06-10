/**
 * Apply advisor tables migration directly.
 * Use if drizzle-kit migrate didn't create advisor_accounts / advisor_clients.
 * Run: npx tsx scripts/apply-advisor-migration.ts
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE "public"."advisor_status" AS ENUM('pending', 'approved', 'rejected');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  console.log("Ensured advisor_status enum");

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "advisor_accounts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "auth_id" text NOT NULL,
      "email" text NOT NULL,
      "business_name" text NOT NULL,
      "status" "advisor_status" DEFAULT 'pending' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "advisor_accounts_auth_id_unique" UNIQUE("auth_id"),
      CONSTRAINT "advisor_accounts_email_unique" UNIQUE("email")
    );
  `);
  console.log("Created advisor_accounts");

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "advisor_clients" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "advisor_id" uuid NOT NULL REFERENCES "public"."advisor_accounts"("id") ON DELETE cascade,
      "venue_id" uuid NOT NULL REFERENCES "public"."venues"("id") ON DELETE cascade,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  console.log("Created advisor_clients");

  await sql.end();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
