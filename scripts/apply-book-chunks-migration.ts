/**
 * Apply book_chunks table migration directly.
 * Use if drizzle-kit migrate didn't create the table yet.
 * Run: npx tsx scripts/apply-book-chunks-migration.ts
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "book_chunks" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "book_id" text NOT NULL,
      "chapter" text NOT NULL,
      "content" text NOT NULL,
      "content_hash" text NOT NULL,
      "source_path" text NOT NULL,
      "chunk_index" integer NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  console.log("Created book_chunks table");

  await sql.unsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "book_chunks_source_chunk_idx"
    ON "book_chunks" ("source_path", "chunk_index");
  `);
  await sql.unsafe(`
    CREATE INDEX IF NOT EXISTS "book_chunks_book_id_idx"
    ON "book_chunks" ("book_id");
  `);
  await sql.unsafe(`
    CREATE INDEX IF NOT EXISTS "book_chunks_content_fts_idx"
    ON "book_chunks" USING gin (to_tsvector('english', content));
  `);
  console.log("Created indexes (including GIN full-text search)");

  await sql.end();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
