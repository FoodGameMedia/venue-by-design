/**
 * Verify or create Stripe products/prices for Venue by Design.
 *
 * Verify (default):
 *   npx tsx scripts/stripe-pricing.ts verify
 *
 * Create missing prices in test mode (writes price IDs to stdout):
 *   npx tsx scripts/stripe-pricing.ts create
 *
 * Create in live mode (requires explicit confirmation):
 *   STRIPE_CREATE_LIVE=1 npx tsx scripts/stripe-pricing.ts create
 *
 * Create a 100% off beta promotion code (test or live):
 *   npx tsx scripts/stripe-pricing.ts create-beta-promo
 *   STRIPE_BETA_PROMO_CODE=VENUEBETA npx tsx scripts/stripe-pricing.ts create-beta-promo
 *   STRIPE_CREATE_LIVE=1 npx tsx scripts/stripe-pricing.ts create-beta-promo
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import Stripe from "stripe";

const CURRENCY = "aud";

const PLANS = {
  STRIPE_PRICE_ESSENTIALS: {
    planId: "essentials",
    name: "Venue Pulse Essentials",
    amount: 3900,
    recurring: { interval: "month" as const },
  },
  STRIPE_PRICE_PRO: {
    planId: "pro",
    name: "Venue Pulse Pro",
    amount: 9900,
    recurring: { interval: "month" as const },
  },
  STRIPE_PRICE_GROUP: {
    planId: "group",
    name: "Venue Pulse Group",
    amount: 29900,
    recurring: { interval: "month" as const },
  },
  STRIPE_PRICE_DIAGNOSTIC_SOLO: {
    planId: "solo",
    name: "Deep Diagnostic Solo",
    amount: 99700,
    recurring: null,
  },
  STRIPE_PRICE_DIAGNOSTIC_STAFF: {
    planId: "staff_pulse",
    name: "Deep Diagnostic Staff Pulse",
    amount: 149700,
    recurring: null,
  },
} as const;

type EnvKey = keyof typeof PLANS;

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Missing STRIPE_SECRET_KEY in .env.local");
    process.exit(1);
  }
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

function modeLabel(key: string): string {
  return key.startsWith("sk_live_") ? "LIVE" : "TEST";
}

async function verifyPrice(stripe: Stripe, envKey: EnvKey, priceId: string) {
  const expected = PLANS[envKey];
  const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });

  const issues: string[] = [];
  if (price.currency !== CURRENCY) {
    issues.push(`currency is ${price.currency}, expected ${CURRENCY}`);
  }
  if (price.unit_amount !== expected.amount) {
    issues.push(
      `amount is ${formatMoney(price.unit_amount ?? 0)}, expected ${formatMoney(expected.amount)}`
    );
  }
  if (expected.recurring) {
    if (!price.recurring) issues.push("expected recurring monthly price");
    else if (price.recurring.interval !== expected.recurring.interval) {
      issues.push(`interval is ${price.recurring.interval}, expected month`);
    }
  } else if (price.recurring) {
    issues.push("expected one-time price");
  }
  if (!price.active) issues.push("price is inactive");

  const productName =
    typeof price.product === "object" && price.product && "name" in price.product
      ? price.product.name
      : String(price.product);

  return {
    envKey,
    priceId,
    productName,
    ok: issues.length === 0,
    issues,
    display: expected.recurring
      ? `${formatMoney(expected.amount)}/mo`
      : formatMoney(expected.amount),
  };
}

async function verify() {
  const stripe = getStripe();
  const key = process.env.STRIPE_SECRET_KEY!;
  console.log(`Stripe verify (${modeLabel(key)})\n`);

  if (process.env.E2E_MOCK_STRIPE_CHECKOUT === "1") {
    console.warn("Warning: E2E_MOCK_STRIPE_CHECKOUT=1 — disable in production.\n");
  }

  let failed = false;
  const missing: EnvKey[] = [];

  for (const envKey of Object.keys(PLANS) as EnvKey[]) {
    const priceId = process.env[envKey]?.trim();
    const expected = PLANS[envKey];

    if (!priceId) {
      missing.push(envKey);
      console.log(`✗ ${envKey}: not set (expected ${expected.name} ${expected.recurring ? formatMoney(expected.amount) + "/mo" : formatMoney(expected.amount)})`);
      failed = true;
      continue;
    }

    try {
      const result = await verifyPrice(stripe, envKey, priceId);
      if (result.ok) {
        console.log(`✓ ${envKey}: ${result.priceId} — ${result.productName} (${result.display})`);
      } else {
        console.log(`✗ ${envKey}: ${result.priceId} — ${result.issues.join("; ")}`);
        failed = true;
      }
    } catch (err) {
      console.log(
        `✗ ${envKey}: ${priceId} — ${err instanceof Error ? err.message : "invalid price ID"}`
      );
      failed = true;
    }
  }

  console.log("");
  if (missing.length > 0) {
    console.log("Run `npx tsx scripts/stripe-pricing.ts create` to create missing prices.");
  }
  if (failed) {
    process.exit(1);
  }
  console.log("All Stripe prices match the public pricing page.");
}

async function create() {
  const stripe = getStripe();
  const key = process.env.STRIPE_SECRET_KEY!;
  const isLive = key.startsWith("sk_live_");

  if (isLive && process.env.STRIPE_CREATE_LIVE !== "1") {
    console.error(
      "Refusing to create LIVE prices without STRIPE_CREATE_LIVE=1.\n" +
        "Set STRIPE_CREATE_LIVE=1 only when you intend to create production products."
    );
    process.exit(1);
  }

  console.log(`Stripe create (${modeLabel(key)})\n`);

  const lines: string[] = [];

  for (const envKey of Object.keys(PLANS) as EnvKey[]) {
    const existing = process.env[envKey]?.trim();
    if (existing) {
      try {
        const check = await verifyPrice(stripe, envKey, existing);
        if (check.ok) {
          console.log(`· ${envKey}: already configured (${existing})`);
          lines.push(`${envKey}=${existing}`);
          continue;
        }
        console.log(`· ${envKey}: replacing misconfigured price ${existing}`);
      } catch {
        console.log(`· ${envKey}: replacing invalid price ${existing}`);
      }
    }

    const plan = PLANS[envKey];
    const product = await stripe.products.create({
      name: plan.name,
      metadata: { planId: plan.planId, venue_by_design: "1" },
    });

    const price = await stripe.prices.create({
      product: product.id,
      currency: CURRENCY,
      unit_amount: plan.amount,
      ...(plan.recurring ? { recurring: plan.recurring } : {}),
      metadata: { planId: plan.planId, envKey },
    });

    const label = plan.recurring ? `${formatMoney(plan.amount)}/mo` : formatMoney(plan.amount);
    console.log(`✓ Created ${plan.name} (${label}) → ${price.id}`);
    lines.push(`${envKey}=${price.id}`);
  }

  console.log("\nAdd these to .env.local (test) or Netlify (production):\n");
  for (const line of lines) {
    console.log(line);
  }
}

async function createBetaPromo() {
  const stripe = getStripe();
  const key = process.env.STRIPE_SECRET_KEY!;
  const isLive = key.startsWith("sk_live_");
  const code = (process.env.STRIPE_BETA_PROMO_CODE ?? "VENUEBETA").trim().toUpperCase();

  if (isLive && process.env.STRIPE_CREATE_LIVE !== "1") {
    console.error(
      "Refusing to create LIVE promotion codes without STRIPE_CREATE_LIVE=1.\n" +
        "Set STRIPE_CREATE_LIVE=1 only when you intend to create production coupons."
    );
    process.exit(1);
  }

  console.log(`Stripe create-beta-promo (${modeLabel(key)})\n`);

  const existing = await stripe.promotionCodes.list({ code, limit: 1 });
  if (existing.data[0]?.active) {
    const promo = existing.data[0];
    console.log(`✓ Promotion code already exists: ${code}`);
    console.log(`  STRIPE_BETA_PROMO_CODE=${code}`);
    console.log(`  STRIPE_BETA_PROMOTION_CODE_ID=${promo.id}`);
    return;
  }

  const coupon = await stripe.coupons.create({
    percent_off: 100,
    duration: "once",
    name: "Venue by Design beta testers",
    metadata: { venue_by_design: "beta" },
  });

  const promotionCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code,
    max_redemptions: 100,
    metadata: { venue_by_design: "beta" },
  } as unknown as Stripe.PromotionCodeCreateParams);

  console.log(`✓ Created 100% off coupon and promotion code: ${code}`);
  console.log(`  Coupon: ${coupon.id}`);
  console.log(`  Promotion code: ${promotionCode.id}`);
  console.log("\nAdd to Netlify / .env.local:\n");
  console.log(`STRIPE_BETA_PROMO_CODE=${code}`);
  console.log(`STRIPE_BETA_PROMOTION_CODE_ID=${promotionCode.id}`);
  console.log(
    "\nBeta testers can enter the code on /pricing or at Stripe Checkout (allow_promotion_codes is enabled)."
  );
}

const command = process.argv[2] ?? "verify";

if (command === "verify") {
  verify().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else if (command === "create") {
  create().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else if (command === "create-beta-promo") {
  createBetaPromo().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  console.error("Usage: npx tsx scripts/stripe-pricing.ts [verify|create|create-beta-promo]");
  process.exit(1);
}
