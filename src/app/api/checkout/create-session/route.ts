import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const PLAN_TO_PRICE: Record<string, string> = {
  essentials: process.env.STRIPE_PRICE_ESSENTIALS ?? "",
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  group: process.env.STRIPE_PRICE_GROUP ?? "",
  solo: process.env.STRIPE_PRICE_DIAGNOSTIC_SOLO ?? "",
  staff_pulse: process.env.STRIPE_PRICE_DIAGNOSTIC_STAFF ?? "",
};

const SUBSCRIPTION_PLANS = ["essentials", "pro", "group"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json(
      { error: "Please sign in to subscribe" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const planId = typeof body.planId === "string" ? body.planId : "";
  const priceId = PLAN_TO_PRICE[planId];
  const isDiagnostic = ["solo", "staff_pulse"].includes(planId);
  const isE2eMockCheckout =
    process.env.E2E_MOCK_STRIPE_CHECKOUT === "1" && process.env.NODE_ENV !== "production";

  if (!priceId && !isE2eMockCheckout) {
    const msg =
      ["solo", "staff_pulse"].includes(planId)
        ? `Deep Diagnostic (${planId}) is not configured. Add STRIPE_PRICE_DIAGNOSTIC_SOLO and STRIPE_PRICE_DIAGNOSTIC_STAFF to .env.local.`
        : "Invalid plan";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, authUser.id),
  });
  if (!dbUser) {
    return NextResponse.json(
      { error: "User not found. Complete onboarding first." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const successUrl = isDiagnostic
    ? `${baseUrl}/diagnostic?checkout=success&session_id={CHECKOUT_SESSION_ID}`
    : `${baseUrl}/dashboard?checkout=success`;
  const cancelUrl = `${baseUrl}/pricing?checkout=cancelled`;

  if (isE2eMockCheckout && isDiagnostic) {
    return NextResponse.json({
      url: `${baseUrl}/api/test/diagnostic-purchase?planId=${planId}`,
    });
  }

  let customerId = dbUser.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      name: dbUser.fullName ?? undefined,
      metadata: { authId: authUser.id, userId: dbUser.id },
    });
    customerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, dbUser.id));
  }

  const isSubscription = SUBSCRIPTION_PLANS.includes(planId);

  // Stripe 2026 API types differ; customer param is valid per Stripe docs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: authUser.id,
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: isSubscription ? "subscription" : "payment",
    metadata: { planId, userId: dbUser.id },
  } as any);

  if (!session.url) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url });
}
