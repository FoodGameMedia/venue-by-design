/**
 * Hourly ceilings on the endpoints that cost money per call.
 *
 * Every Systems endpoint that reaches for Claude spends real money, and until
 * now nothing stopped one venue calling them in a loop. The entitlement gate
 * decides who may call; this decides how often.
 *
 * It counts rows rather than keeping a counter, for two reasons. The app runs
 * as serverless functions, so an in-memory counter resets whenever a new
 * instance starts and enforces nothing (the chat limiter in
 * `venue-advisor-chat.ts` has this problem and is noted on the record). And
 * every action worth limiting already writes a row, so the count is the truth
 * rather than a shadow of it. No new table, no migration.
 *
 * The ceilings are generous on purpose. They are there to stop a runaway loop
 * or a scripted abuse of a $39 account, not to ration an operator doing a real
 * afternoon's work. If a real venue ever hits one, the number is wrong, not
 * the venue.
 */
import { and, count, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { procedures, procedureAudits, procedureVersions } from "@/db/schema";

export type SpendAction = "generate" | "ingest" | "audit";

/** Per venue, per rolling hour. */
export const HOURLY_LIMITS: Record<SpendAction, number> = {
  // The whole catalogue is nineteen items. Twenty-five is the catalogue plus
  // a few reconsidered, which is a heavy but plausible afternoon.
  generate: 25,
  // A binder at a time, not a filing cabinet.
  ingest: 20,
  // Auditing is re-runnable, so this sits above ingest.
  audit: 40,
};

export class SpendLimitError extends Error {
  constructor(public readonly action: SpendAction) {
    super(messageFor(action));
    this.name = "SpendLimitError";
  }
}

function messageFor(action: SpendAction): string {
  const noun =
    action === "generate"
      ? "written this many procedures"
      : action === "ingest"
        ? "uploaded this many procedures"
        : "run this many audits";
  return `You have ${noun} in the past hour. Give it an hour and carry on. If you are doing this much in one sitting, you are probably installing more at once than a venue can hold.`;
}

function oneHourAgo(): Date {
  return new Date(Date.now() - 60 * 60 * 1000);
}

async function countSince(action: SpendAction, venueId: string): Promise<number> {
  const since = oneHourAgo();

  if (action === "audit") {
    // Audits hang off versions, which hang off procedures, so the venue is two
    // joins away. Two joins rather than a subquery: one round trip either way,
    // and this one reads as what it is.
    const [row] = await db
      .select({ value: count() })
      .from(procedureAudits)
      .innerJoin(procedureVersions, eq(procedureVersions.id, procedureAudits.versionId))
      .innerJoin(procedures, eq(procedures.id, procedureVersions.procedureId))
      .where(and(eq(procedures.venueId, venueId), gte(procedureAudits.createdAt, since)));
    return row?.value ?? 0;
  }

  // "generate" writes a procedure with provenance `generated`; "ingest" writes
  // one with any of the imported or audited provenances. Counting by
  // provenance keeps the two ceilings independent.
  const provenances =
    action === "generate"
      ? (["generated"] as const)
      : (["imported", "audited_keep", "audited_rewrite"] as const);

  const [row] = await db
    .select({ value: count() })
    .from(procedures)
    .where(
      and(
        eq(procedures.venueId, venueId),
        gte(procedures.createdAt, since),
        inArray(procedures.provenance, [...provenances])
      )
    );
  return row?.value ?? 0;
}

/**
 * Throws when the venue has spent its hour.
 *
 * Fails **open** on a database fault, which is the opposite of the entitlement
 * gate and deliberate: entitlement decides whether someone is allowed in at
 * all, so an unproven answer must refuse. This only decides whether someone
 * who is already entitled has gone too fast, and refusing a paying operator
 * because a count query hiccuped is the worse failure of the two.
 */
export async function assertWithinSpendLimit(
  action: SpendAction,
  venueId: string
): Promise<void> {
  let used: number;
  try {
    used = await countSince(action, venueId);
  } catch {
    return;
  }

  if (used >= HOURLY_LIMITS[action]) {
    throw new SpendLimitError(action);
  }
}
