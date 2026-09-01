import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { resolvePromotionCodeId } from "@/lib/stripe-promo";
import { captureException } from "@/lib/sentry";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const SUBSCRIPTION_PLANS = ["essentials", "pro", "group"];

const PLAN_TO_ENV_KEY: Record<string, string> = {
  essentials: "STRIPE_PRICE_ESSENTIALS",
  pro: "STRIPE_PRICE_PRO",
  group: "STRIPE_PRICE_GROUP",
  solo: "STRIPE_PRICE_DIAGNOSTIC_SOLO",
  staff_pulse: "STRIPE_PRICE_DIAGNOSTIC_STAFF",
};

/** Read Stripe price IDs at request time (not build time) for Netlify/runtime env. */
function getPriceIdForPlan(planId: string): string {
  const envKey = PLAN_TO_ENV_KEY[planId];
  if (!envKey) return "";
  return process.env[envKey]?.trim() ?? "";
}

function getMissingCheckoutEnv(planId?: string): string | null {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) return "STRIPE_SECRET_KEY";
  if (!process.env.DATABASE_URL?.trim()) return "DATABASE_URL";
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return "NEXT_PUBLIC_SITE_URL";
  }

  if (planId && PLAN_TO_ENV_KEY[planId] && !getPriceIdForPlan(planId)) {
    return PLAN_TO_ENV_KEY[planId];
  }

  return null;
}

export async function POST(request: Request) {
  let planId = "";

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const payload = body as {
      planId?: unknown;
      acceptedTerms?: unknown;
      promoCode?: unknown;
    };

    planId = typeof payload.planId === "string" ? payload.planId : "";

    if (payload.acceptedTerms !== true) {
      return NextResponse.json(
        { error: "Please accept the Terms & Conditions and Privacy Policy to continue." },
        { status: 400 }
      );
    }

    const promoCode =
      typeof payload.promoCode === "string" ? payload.promoCode.trim() : "";

    const missingEnv = getMissingCheckoutEnv(planId || undefined);
    if (missingEnv) {
      console.error(`[checkout/create-session] Missing required env: ${missingEnv}`);
      return NextResponse.json(
        { error: "Checkout is not configured. Please contact support." },
        { status: 503 }
      );
    }

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

    const priceId = getPriceIdForPlan(planId);
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

    let promotionCodeId: string | null = null;
    if (promoCode) {
      promotionCodeId = await resolvePromotionCodeId(promoCode);
      if (!promotionCodeId) {
        return NextResponse.json(
          { error: "Promotion code is invalid or expired." },
          { status: 400 }
        );
      }
    }

    // Stripe 2026 API types differ; customer param is valid per Stripe docs
    const sessionParams: Record<string, unknown> = {
      customer: customerId,
      client_reference_id: authUser.id,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? "subscription" : "payment",
      allow_promotion_codes: !promotionCodeId,
      metadata: {
        planId,
        userId: dbUser.id,
        acceptedTermsAt: new Date().toISOString(),
        ...(promoCode ? { promoCode } : {}),
      },
    };

    if (promotionCodeId) {
      sessionParams.discounts = [{ promotion_code: promotionCodeId }];
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as unknown as Stripe.Checkout.SessionCreateParams
    );

    if (!session.url) {
      console.error("[checkout/create-session] Stripe session created without url", {
        sessionId: session.id,
        planId,
      });
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    captureException(err, { context: "checkout_create_session", planId });
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[checkout/create-session]", message);

    if (err instanceof Stripe.errors.StripeError) {
      console.error("[checkout/create-session] Stripe error", {
        type: err.type,
        code: err.code,
        planId,
      });
      return NextResponse.json(
        { error: "Unable to start checkout. Please try again or contact support." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 }
    );
  }
}
