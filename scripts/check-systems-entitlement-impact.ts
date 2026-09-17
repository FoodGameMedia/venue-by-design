/**
 * Who does the Systems gate lock out?
 *
 * Run this before deploying the entitlement split. Gating a module that has
 * been open to everyone since it shipped will take it away from somebody, and
 * it is better to know the number now than to hear it from them.
 *
 *   npx tsx scripts/check-systems-entitlement-impact.ts
 *
 * Reads only. Writes nothing.
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import { db } from "../src/db";
import { users, venues, subscriptions, procedures } from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";

const LIVE = ["trialing", "active", "past_due"] as const;
const RANK = { free: 0, essentials: 1, pro: 2, group: 3 } as const;
type Plan = keyof typeof RANK;

async function main() {
  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
  const allVenues = await db.select({ userId: venues.userId }).from(venues);
  const live = await db
    .select({ userId: subscriptions.userId, plan: subscriptions.plan })
    .from(subscriptions)
    .where(inArray(subscriptions.status, [...LIVE]));

  const hasVenue = new Set(allVenues.map((v) => v.userId));
  const planOf = new Map<string, Plan>();
  for (const row of live) {
    const plan = row.plan as Plan;
    const best = planOf.get(row.userId) ?? "free";
    if (RANK[plan] > RANK[best]) planOf.set(row.userId, plan);
  }

  const buckets: Record<Plan, string[]> = { free: [], essentials: [], pro: [], group: [] };
  for (const u of allUsers) {
    if (!hasVenue.has(u.id)) continue;
    buckets[planOf.get(u.id) ?? "free"].push(u.email ?? u.id);
  }

  const withProcedures = await db
    .select({ venueId: procedures.venueId })
    .from(procedures);
  const venuesWithProcedures = new Set(withProcedures.map((p) => p.venueId));

  console.log("Operators with a venue, by live plan:");
  for (const plan of ["free", "essentials", "pro", "group"] as const) {
    console.log(`  ${plan.padEnd(11)} ${buckets[plan].length}`);
  }

  console.log("");
  console.log(`Venues holding at least one procedure: ${venuesWithProcedures.size}`);
  console.log("");
  console.log("After the split:");
  console.log(`  lose Systems entirely (no live plan): ${buckets.free.length}`);
  console.log(`  keep the catalogue, lose the audit:   ${buckets.essentials.length}`);
  console.log(`  unaffected (Pro or Group):            ${buckets.pro.length + buckets.group.length}`);

  if (buckets.free.length > 0) {
    console.log("");
    console.log("No live plan, but has a venue:");
    for (const who of buckets.free) console.log(`  ${who}`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
