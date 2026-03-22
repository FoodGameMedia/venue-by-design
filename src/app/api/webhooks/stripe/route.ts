import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, priceToPlan, priceToDiagnosticPlan } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions, users, diagnosticPurchases } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook handler error: ${message}`);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// ── Handlers ────────────────────────────────────────────────────────────────────

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? "";

  const user = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, customerId),
  });

  if (!user) {
    throw new Error(`No user found for Stripe customer ${customerId}`);
  }

  await db.insert(subscriptions).values({
    userId: user.id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    stripePriceId: priceId,
    plan: priceToPlan(priceId),
    status: subscription.status as typeof subscriptions.$inferInsert.status,
    currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
    currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? "";

  await db
    .update(subscriptions)
    .set({
      stripePriceId: priceId,
      plan: priceToPlan(priceId),
      status: subscription.status as typeof subscriptions.$inferInsert.status,
      currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const customerId = typeof session.customer === "string"
    ? session.customer
    : session.customer?.id;

  if (session.mode === "subscription") {
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

    if (!customerId || !subscriptionId) return;

    if (session.client_reference_id) {
      await db
        .update(users)
        .set({
          stripeCustomerId: customerId,
          updatedAt: new Date(),
        })
        .where(eq(users.authId, session.client_reference_id));
    }

    const existing = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, subscriptionId),
    });

    if (!existing) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      await handleSubscriptionCreated(stripeSubscription);
    }
    return;
  }

  if (session.mode === "payment") {
    const planId = session.metadata?.planId as string | undefined;
    const userId = session.metadata?.userId as string | undefined;
    if (!userId || !planId) return;

    const diagnosticPlan = ["solo", "staff_pulse"].includes(planId)
      ? (planId as "solo" | "staff_pulse")
      : null;
    if (!diagnosticPlan) return;

    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

    await db.insert(diagnosticPurchases).values({
      userId,
      stripePaymentIntentId: paymentIntentId ?? null,
      stripeSessionId: session.id,
      plan: diagnosticPlan,
    });
  }
}
