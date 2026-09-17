/**
 * The page-side equivalent of `access.ts`.
 *
 * Server components redirect rather than return a status code, so they need a
 * slightly different shape from the API routes. The ownership rule is the same.
 */
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, venues } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  planForUser,
  planCarries,
  type PricingPlan,
  type SystemsCapability,
} from "./entitlements";

export interface SystemsPageContext {
  userId: string;
  venueId: string;
  venueName: string;
  plan: PricingPlan;
  /** True when this plan reaches that half of the module. */
  carries: (capability: SystemsCapability) => boolean;
}

/**
 * Resolve the signed-in operator's venue for a Systems page.
 * Sends them to login, or to onboarding when they have no venue yet.
 */
export async function requireSystemsContext(
  redirectTo: string
): Promise<SystemsPageContext> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, authUser.id),
    columns: { id: true },
  });

  if (!dbUser) {
    redirect("/onboarding");
  }

  const venue = await db.query.venues.findFirst({
    where: eq(venues.userId, dbUser.id),
    columns: { id: true, name: true },
  });

  if (!venue) {
    redirect("/onboarding");
  }

  const plan = await planForUser(dbUser.id);

  return {
    userId: dbUser.id,
    venueId: venue.id,
    venueName: venue.name,
    plan,
    carries: (capability) => planCarries(plan, capability),
  };
}

/**
 * The same, but for a screen that has nothing to show a plan that cannot reach
 * it. The upload and audit screens are the only two: everything else can render
 * and put the upgrade in context, which is more useful than a bounce.
 */
export async function requireSystemsCapability(
  redirectTo: string,
  capability: SystemsCapability
): Promise<SystemsPageContext> {
  const context = await requireSystemsContext(redirectTo);
  if (!context.carries(capability)) {
    redirect(`/pricing?systems=${capability}`);
  }
  return context;
}
