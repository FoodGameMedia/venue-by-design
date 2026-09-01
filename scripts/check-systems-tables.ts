/**
 * Confirm the Systems module tables and enums exist, migrations 0007 and 0008.
 * Read-only. Run: npx tsx scripts/check-systems-tables.ts
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import postgres from "postgres";

const TABLES = [
  "breakpoints",
  "procedures",
  "procedure_versions",
  "procedure_audits",
  "procedure_validations",
  "procedure_exports",
  "catalogue_selections",
  "venue_obligations",
];

const ENUMS = [
  "procedure_status",
  "procedure_verdict",
  "procedure_provenance",
  "procedure_export_format",
  "procedure_author",
  "catalogue_selection_state",
  "obligation_status",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(url);
  let failed = false;

  try {
    const tableRows = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ${sql([...TABLES])}
    `;
    const foundTables = new Set(tableRows.map((r) => r.table_name));

    for (const t of TABLES) {
      const ok = foundTables.has(t);
      if (!ok) failed = true;
      console.log(`${ok ? "ok  " : "MISSING"} table ${t}`);
    }

    const enumRows = await sql<{ typname: string }[]>`
      SELECT typname FROM pg_type
      WHERE typtype = 'e' AND typname IN ${sql([...ENUMS])}
    `;
    const foundEnums = new Set(enumRows.map((r) => r.typname));

    for (const e of ENUMS) {
      const ok = foundEnums.has(e);
      if (!ok) failed = true;
      console.log(`${ok ? "ok  " : "MISSING"} enum  ${e}`);
    }

    const applied = await sql<{ hash: string; created_at: string }[]>`
      SELECT hash, created_at FROM drizzle.__drizzle_migrations
      ORDER BY created_at DESC LIMIT 3
    `.catch(() => []);
    console.log(`\nmigration rows recorded: ${applied.length}`);
  } finally {
    await sql.end();
  }

  if (failed) {
    console.error("\nThe Systems schema has NOT fully applied.");
    process.exit(1);
  }
  console.log("\nAll Systems tables and enums present.");
}

main();
