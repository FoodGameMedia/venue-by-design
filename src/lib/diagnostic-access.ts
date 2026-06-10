import { db } from "@/db";
import { diagnosticPurchases } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { priceToDiagnosticPlan } from "@/lib/stripe";

export async function hasDiagnosticAccess(userId: string): Promise<boolean> {
  try {
    const purchases = await db.query.diagnosticPurchases.findMany({
      where: eq(diagnosticPurchases.userId, userId),
      limit: 1,
    });
    return purchases.length > 0;
  } catch {
    return false;
  }
}

/**
 * Verify a Stripe checkout session and record the purchase if not already recorded.
 * Call this when user lands on /diagnostic?checkout=success&session_id=xxx
 */
export async function verifyAndRecordDiagnosticPurchase(
  sessionId: string,
  userId: string
): Promise<{ ok: boolean; plan?: string }> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return { ok: false };
  }

  const planId = session.metadata?.planId as string | undefined;
  if (!planId || !["solo", "staff_pulse"].includes(planId)) {
    return { ok: false };
  }

  const priceId = (session.line_items?.data?.[0] as { price?: { id?: string } } | undefined)?.price?.id;
  const plan = priceToDiagnosticPlan(priceId ?? "") ?? (planId as "solo" | "staff_pulse");

  const existing = await db.query.diagnosticPurchases.findFirst({
    where: eq(diagnosticPurchases.stripeSessionId, sessionId),
  });
  if (existing) {
    return { ok: true, plan: existing.plan };
  }

  await db.insert(diagnosticPurchases).values({
    userId,
    stripeSessionId: sessionId,
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
    plan,
  });

  return { ok: true, plan };
}
