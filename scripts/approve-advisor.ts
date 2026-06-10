/**
 * Approve or reject an advisor account by email.
 * Usage:
 *   npx tsx scripts/approve-advisor.ts advisor@example.com approved
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";

const email = process.argv[2]?.trim().toLowerCase();
const status = process.argv[3] ?? "approved";
const validStatuses = new Set(["pending", "approved", "rejected"]);

if (!email || !validStatuses.has(status)) {
  console.error("Usage: npx tsx scripts/approve-advisor.ts advisor@example.com approved");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  const rows = await sql`
    UPDATE advisor_accounts
    SET status = ${status}::advisor_status,
        updated_at = now()
    WHERE email = ${email}
    RETURNING id, email, business_name, status
  `;

  await sql.end();

  if (!rows.length) {
    console.error(`No advisor account found for ${email}`);
    process.exit(1);
  }

  const account = rows[0];
  console.log(
    `Advisor ${account.email} (${account.business_name}) is now ${account.status}.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
