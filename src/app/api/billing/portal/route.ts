import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { captureException } from "@/lib/sentry";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, authUser.id),
  });

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  // No billing account yet: send them to plans to upgrade or add a new service.
  if (!dbUser?.stripeCustomerId) {
    return NextResponse.redirect(`${origin}/pricing`, { status: 303 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.redirect(session.url);
  } catch (err) {
    captureException(err, { context: "billing_portal", userId: dbUser.id });
    return NextResponse.redirect(`${origin}/pricing`, { status: 303 });
  }
}
