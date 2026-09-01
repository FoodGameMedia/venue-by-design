/**
 * Apply one Drizzle migration file directly.
 *
 * Why this exists rather than `npm run db:migrate`: drizzle's
 * `__drizzle_migrations` table is empty while the database is fully built, so
 * drizzle-kit replays from 0000 and aborts on the first object that already
 * exists. The repo already handles this with per-migration apply scripts. This
 * is the generic version of that, so each new migration does not need its own.
 *
 * Safe to run more than once: "already exists" errors are treated as success.
 *
 * Run: npx tsx scripts/apply-migration.ts 0008_catalogue_and_obligations.sql
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

/** Postgres codes that mean "this object is already there". */
const ALREADY_EXISTS = new Set([
  "42P06", // duplicate_schema
  "42P07", // duplicate_table
  "42710", // duplicate_object (type, constraint)
  "42701", // duplicate_column
]);

function resolveMigration(arg: string | undefined): string {
  const dir = join(process.cwd(), "drizzle");

  if (arg) {
    const name = arg.endsWith(".sql") ? arg : `${arg}.sql`;
    if (!existsSync(join(dir, name))) {
      console.error(`No such migration: drizzle/${name}`);
      process.exit(1);
    }
    return name;
  }

  const latest = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .at(-1);

  if (!latest) {
    console.error("No migrations found in drizzle/");
    process.exit(1);
  }

  console.log(`No migration named, using the latest: ${latest}\n`);
  return latest;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const name = resolveMigration(process.argv[2]);
  const statements = readFileSync(join(process.cwd(), "drizzle", name), "utf8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Applying ${name}: ${statements.length} statements.\n`);

  const sql = postgres(url, { onnotice: () => {} });
  let applied = 0;
  let skipped = 0;

  try {
    for (const [index, statement] of statements.entries()) {
      const label = statement.split("\n")[0].slice(0, 70);
      try {
        await sql.unsafe(statement);
        applied += 1;
        console.log(`ok      ${label}`);
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code && ALREADY_EXISTS.has(code)) {
          skipped += 1;
          console.log(`exists  ${label}`);
          continue;
        }
        console.error(`\nFailed on statement ${index + 1}:\n${statement}\n`);
        throw error;
      }
    }
  } finally {
    await sql.end();
  }

  console.log(`\nDone. ${applied} applied, ${skipped} already existed.`);
  console.log("Now run: npx tsx scripts/check-systems-tables.ts");
}

main();
