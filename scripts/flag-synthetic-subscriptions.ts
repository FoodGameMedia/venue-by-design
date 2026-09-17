/**
 * Mark every non-Stripe subscription row as synthetic, so it can never be
 * mistaken for revenue.
 *
 *   npx tsx scripts/flag-synthetic-subscriptions.ts          # report only
 *   npx tsx scripts/flag-synthetic-subscriptions.ts --write  # stamp them
 *
 * Why this exists. The e2e seed writes a subscription row directly so the test
 * account can reach the gated parts of Systems. That row says `active` and
 * `group` and Stripe has never heard of it. Anything that later counts rows in
 * this table, a revenue figure, a customer count, a reconciliation against
 * Stripe, would count it as a paying customer. Stamping it is cheaper than
 * remembering.
 *
 * A row is synthetic when its Stripe identifiers carry the `_e2e` marker the
 * seed writes. Real Stripe ids never do: they are `sub_`, `cus_` or `price_`
 * followed by an opaque token.
 *
 * Idempotent. Safe to run as often as you like. Reports before it writes, and
 * writes nothing without `--write`.
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import postgres from "postgres";

interface Row {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  plan: string;
  status: string;
  metadata: Record<string, unknown> | null;
  email: string | null;
}

/** The seed's marker. Real Stripe identifiers never contain it. */
function looksSynthetic(row: Row): boolean {
  return [row.stripe_subscription_id, row.stripe_customer_id, row.stripe_price_id].some(
    (id) => typeof id === "string" && id.includes("_e2e")
  );
}

async function main() {
  const write = process.argv.includes("--write");
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Check .env.local.");
    process.exit(1);
  }

  const sql = postgres(url, { prepare: false });

  try {
    const rows = await sql<Row[]>`
      select s.id, s.user_id, s.stripe_subscription_id, s.stripe_customer_id,
             s.stripe_price_id, s.plan, s.status, s.metadata, u.email
      from subscriptions s
      left join users u on u.id = s.user_id
      order by s.created_at
    `;

    const synthetic = rows.filter(looksSynthetic);
    const real = rows.filter((r) => !looksSynthetic(r));
    const unstamped = synthetic.filter((r) => r.metadata?.synthetic !== true);

    console.log(`Subscription rows: ${rows.length}`);
    console.log(`  genuine (Stripe):  ${real.length}`);
    console.log(`  synthetic (seeded): ${synthetic.length}, of which ${unstamped.length} unstamped`);

    if (synthetic.length > 0) {
      console.log("");
      console.log("Synthetic rows:");
      for (const r of synthetic) {
        const mark = r.metadata?.synthetic === true ? "stamped" : "NOT STAMPED";
        console.log(`  ${r.email ?? r.user_id}  ${r.plan}/${r.status}  ${r.stripe_subscription_id}  [${mark}]`);
      }
    }

    if (unstamped.length === 0) {
      console.log("");
      console.log("Nothing to do.");
      return;
    }

    if (!write) {
      console.log("");
      console.log(`Re-run with --write to stamp ${unstamped.length} row(s).`);
      return;
    }

    for (const r of unstamped) {
      await sql`
        update subscriptions
        set metadata = coalesce(metadata, '{}'::jsonb) || ${sql.json({
          synthetic: true,
          reason: "Seeded by scripts/seed-e2e-user.ts so the test account can reach gated features. Not a customer. Exclude from every revenue and customer count.",
          stamped_at: new Date().toISOString(),
        })}::jsonb
        where id = ${r.id}
      `;
      console.log(`Stamped ${r.email ?? r.user_id}`);
    }

    console.log("");
    console.log("Any query that counts customers or revenue must exclude rows where");
    console.log("  metadata->>'synthetic' = 'true'");
  } finally {
    await sql.end({ timeout: 5 });
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
