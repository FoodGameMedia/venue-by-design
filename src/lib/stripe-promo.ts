import { stripe } from "@/lib/stripe";

/**
 * Resolve a Stripe promotion code ID from a customer-facing code (e.g. VENUEBETA).
 * Set STRIPE_BETA_PROMO_CODE in env to document the expected beta code string.
 * Optionally set STRIPE_BETA_PROMOTION_CODE_ID to skip the API lookup in production.
 */
export async function resolvePromotionCodeId(code: string): Promise<string | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const configuredId = process.env.STRIPE_BETA_PROMOTION_CODE_ID?.trim();
  const configuredCode = process.env.STRIPE_BETA_PROMO_CODE?.trim();
  if (configuredId && configuredCode && trimmed.toUpperCase() === configuredCode.toUpperCase()) {
    return configuredId;
  }

  const list = await stripe.promotionCodes.list({
    code: trimmed,
    active: true,
    limit: 1,
  });

  return list.data[0]?.id ?? null;
}
