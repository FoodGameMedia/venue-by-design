/**
 * Who does the Systems gate lock out?
 *
 * Run before deploying the entitlement split. Gating a module that has been
 * open to everyone since it shipped will take it away from somebody, and it is
 * better to know the number now than to hear it from them.
 *
 *   npx tsx scripts/check-systems-entitlement-impact.ts
 *
 * Reads only. Writes nothing.
 *
 * Uses `postgres` directly rather than Drizzle. ES module imports are hoisted,
 * so `import { db } from "../src/db"` runs before the dotenv call below it and
 * the pool is built with no DATABASE_URL, which fails against whatever local
 * default Postgres picks. The same reason `check-systems-tables.ts` does this.
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import postgres from "postgres";

const LIVE = ["trialing", "active", "past_due"];
const RANK: Record<string, number> = { free: 0, essentials: 1, pro: 2, group: 3 };

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Check .env.local.");
    process.exit(1);
  }

  const sql = postgres(url, { prepare: false });

  try {
    const rows = await sql<{ email: string; plan: string | null }[]>`
      select
        u.email,
        (
          select s.plan
          from subscriptions s
          where s.user_id = u.id
            and s.status = any(${LIVE})
          order by case s.plan
            when 'group' then 3 when 'pro' then 2 when 'essentials' then 1 else 0
          end desc
          limit 1
        ) as plan
      from users u
      where exists (select 1 from venues v where v.user_id = u.id)
    `;

    const [{ count: syntheticCount }] = await sql<{ count: string }[]>`
      select count(*)::text as count from subscriptions
      where metadata->>'synthetic' = 'true'
    `;

    const [{ count: venuesWithProcedures }] = await sql<{ count: string }[]>`
      select count(distinct venue_id)::text as count from procedures
    `;

    const buckets: Record<string, string[]> = { free: [], essentials: [], pro: [], group: [] };
    for (const row of rows) {
      const plan = row.plan && row.plan in RANK ? row.plan : "free";
      buckets[plan].push(row.email);
    }

    console.log("Operators with a venue, by live plan:");
    for (const plan of ["free", "essentials", "pro", "group"]) {
      console.log(`  ${plan.padEnd(11)} ${buckets[plan].length}`);
    }

    console.log("");
    console.log(`Venues holding at least one procedure: ${venuesWithProcedures}`);
    if (Number(syntheticCount) > 0) {
      console.log(
        `Seeded, non-customer subscriptions counted above: ${syntheticCount}. These are not revenue.`
      );
    }
    console.log("");
    console.log("After the split:");
    console.log(`  lose Systems entirely (no live plan): ${buckets.free.length}`);
    console.log(`  keep the catalogue, lose the audit:   ${buckets.essentials.length}`);
    console.log(`  unaffected (Pro or Group):            ${buckets.pro.length + buckets.group.length}`);

    if (buckets.free.length > 0) {
      console.log("");
      console.log("Has a venue, no live plan:");
      for (const who of buckets.free) console.log(`  ${who}`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
