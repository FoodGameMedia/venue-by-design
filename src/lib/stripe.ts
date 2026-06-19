import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function createStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });
}

function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = createStripeClient();
  }
  return stripeClient;
}

/** Lazy Stripe client so missing keys at build time do not break serverless bundles. */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripeClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/**
 * Map a Stripe price ID to the internal plan name.
 */
export function priceToPlan(priceId: string): "essentials" | "pro" | "group" | "free" {
  const map: Record<string, "essentials" | "pro" | "group"> = {};
  const essentials = process.env.STRIPE_PRICE_ESSENTIALS?.trim();
  const pro = process.env.STRIPE_PRICE_PRO?.trim();
  const group = process.env.STRIPE_PRICE_GROUP?.trim();
  if (essentials) map[essentials] = "essentials";
  if (pro) map[pro] = "pro";
  if (group) map[group] = "group";
  return map[priceId] ?? "free";
}

/**
 * Map a Stripe price ID to the diagnostic plan name (one-time purchase).
 */
export function priceToDiagnosticPlan(priceId: string): "solo" | "staff_pulse" | null {
  const map: Record<string, "solo" | "staff_pulse"> = {};
  const solo = process.env.STRIPE_PRICE_DIAGNOSTIC_SOLO?.trim();
  const staff = process.env.STRIPE_PRICE_DIAGNOSTIC_STAFF?.trim();
  if (solo) map[solo] = "solo";
  if (staff) map[staff] = "staff_pulse";
  return map[priceId] ?? null;
}
