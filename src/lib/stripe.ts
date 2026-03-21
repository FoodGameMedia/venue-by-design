import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

/**
 * Map a Stripe price ID to the internal plan name.
 */
export function priceToPlan(priceId: string): "essentials" | "pro" | "group" | "free" {
  const map: Record<string, "essentials" | "pro" | "group"> = {
    [process.env.STRIPE_PRICE_ESSENTIALS!]: "essentials",
    [process.env.STRIPE_PRICE_PRO!]: "pro",
    [process.env.STRIPE_PRICE_GROUP!]: "group",
  };
  return map[priceId] ?? "free";
}
