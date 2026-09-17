/**
 * Which plan carries which half of the Systems module.
 *
 * The module splits because the two halves answer different questions for
 * different operators. The catalogue and the interview are how a new venue gets
 * on its feet: it has no procedures, so it picks from the starting set and we
 * write them. That belongs at the entry price, because the operator who most
 * needs it is the one least likely to be paying $99 in their first month.
 *
 * The audit is the other direction. It judges a binder that already exists,
 * which means an operator far enough along to have written one, and it is the
 * expensive half: every upload is parsed, retrieved against the books and sent
 * to the model. That belongs in Pro, where the price can carry it.
 *
 * Before this file existed there was no check at all. Signed in with a venue
 * was the whole gate, so the module shipped free to every tier and to anyone
 * whose subscription had lapsed.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";

export type PricingPlan = "free" | "essentials" | "pro" | "group";

/** What a Systems screen or endpoint needs the caller to be entitled to. */
export type SystemsCapability = "catalogue" | "audit";

/** Ascending. A plan carries everything the plans below it carry. */
const PLAN_RANK: Record<PricingPlan, number> = {
  free: 0,
  essentials: 1,
  pro: 2,
  group: 3,
};

const REQUIRED_RANK: Record<SystemsCapability, number> = {
  catalogue: PLAN_RANK.essentials,
  audit: PLAN_RANK.pro,
};

/** The plan a capability is sold under, for copy that has to name it. */
export const CAPABILITY_PLAN_LABEL: Record<SystemsCapability, string> = {
  catalogue: "Venue Pulse Essentials",
  audit: "Venue Pulse Pro",
};

/**
 * Statuses that still carry entitlement.
 *
 * `trialing` counts: a trial that cannot use the product is not a trial.
 * `past_due` counts deliberately, because Stripe retries for days and locking
 * an operator out over a card that will succeed on the second attempt costs
 * more goodwill than the few generations it saves. Everything else does not.
 */
const LIVE_STATUSES = ["trialing", "active", "past_due"] as const;

/** The caller's best live plan. `free` when nothing is live. */
export async function planForUser(userId: string): Promise<PricingPlan> {
  try {
    const rows = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, [...LIVE_STATUSES])
      ),
      columns: { plan: true },
    });

    // Someone may hold more than one live subscription through an upgrade that
    // has not finished settling. The higher plan wins rather than the newest.
    return rows.reduce<PricingPlan>((best, row) => {
      const plan = row.plan as PricingPlan;
      return PLAN_RANK[plan] > PLAN_RANK[best] ? plan : best;
    }, "free");
  } catch {
    // A database fault must not hand out entitlement it cannot prove.
    return "free";
  }
}

export function planCarries(plan: PricingPlan, capability: SystemsCapability): boolean {
  return PLAN_RANK[plan] >= REQUIRED_RANK[capability];
}

export async function userCarries(
  userId: string,
  capability: SystemsCapability
): Promise<boolean> {
  return planCarries(await planForUser(userId), capability);
}

/** The sentence a screen shows when the plan does not reach. */
export function upgradeMessageFor(capability: SystemsCapability): string {
  return capability === "audit"
    ? "Auditing procedures you already have is part of Venue Pulse Pro. Essentials writes you a starting set from the catalogue, and Pro judges the binder you already keep."
    : "The Systems module is part of Venue Pulse. Pick a plan and we will write your starting set.";
}
