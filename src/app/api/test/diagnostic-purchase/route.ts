import { db } from "@/db";
import { diagnosticPurchases, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.E2E_MOCK_STRIPE_CHECKOUT !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const planId = url.searchParams.get("planId");
  if (!planId || !["solo", "staff_pulse"].includes(planId)) {
    return NextResponse.json({ error: "Invalid diagnostic plan" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.redirect(new URL("/login?redirectTo=/pricing", url.origin));
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, authUser.id),
  });
  if (!dbUser) {
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  await db.insert(diagnosticPurchases).values({
    userId: dbUser.id,
    stripeSessionId: `e2e_${authUser.id}_${Date.now()}`,
    stripePaymentIntentId: `pi_e2e_${Date.now()}`,
    plan: planId,
  });

  return NextResponse.redirect(new URL("/diagnostic", url.origin));
}
