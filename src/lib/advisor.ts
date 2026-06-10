import { db } from "@/db";
import {
  advisorAccounts,
  advisorClients,
  users,
  venues,
  checkins,
  domainScores,
  prescriptions,
} from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export type AdvisorAccount = typeof advisorAccounts.$inferSelect;

export interface ClientDomainScore {
  domain: string;
  score: number;
}

export interface ClientPrescription {
  primaryDomain: string;
  primaryProblem: string;
  weekFocus: string;
  watchSignal: string;
  createdAt: Date;
}

export interface AdvisorClientSummary {
  venueId: string;
  venueName: string;
  venueType: string | null;
  calmIndex: number | null;
  domainScores: ClientDomainScore[];
  latestPrescription: ClientPrescription | null;
}

/**
 * Fetch an advisor account by Supabase auth id.
 */
export async function getAdvisorByAuthId(authId: string): Promise<AdvisorAccount | null> {
  const account = await db.query.advisorAccounts.findFirst({
    where: eq(advisorAccounts.authId, authId),
  });
  return account ?? null;
}

/**
 * Returns true only when the advisor exists and is approved.
 */
export async function isApprovedAdvisor(authId: string): Promise<boolean> {
  const account = await getAdvisorByAuthId(authId);
  return account?.status === "approved";
}

/**
 * Create a new advisor account in the pending state.
 * Throws if an account already exists for this auth id.
 */
export async function createAdvisorAccount(input: {
  authId: string;
  email: string;
  businessName: string;
}): Promise<AdvisorAccount> {
  const existing = await getAdvisorByAuthId(input.authId);
  if (existing) {
    throw new Error("Advisor account already exists");
  }

  const [inserted] = await db
    .insert(advisorAccounts)
    .values({
      authId: input.authId,
      email: input.email,
      businessName: input.businessName,
      status: "pending",
    })
    .returning();

  return inserted;
}

/**
 * Build the per-client summary (latest Calm Index, domain scores, latest prescription)
 * for a single venue.
 */
export async function getClientSummary(
  venueId: string
): Promise<AdvisorClientSummary | null> {
  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, venueId),
  });
  if (!venue) return null;

  const latestCheckin = await db.query.checkins.findFirst({
    where: eq(checkins.venueId, venueId),
    orderBy: [desc(checkins.createdAt)],
  });

  const scores = await db.query.domainScores.findMany({
    where: eq(domainScores.venueId, venueId),
  });

  const latestPrescription = await db.query.prescriptions.findFirst({
    where: eq(prescriptions.venueId, venueId),
    orderBy: [desc(prescriptions.createdAt)],
  });

  return {
    venueId: venue.id,
    venueName: venue.name,
    venueType: venue.venueType ?? null,
    calmIndex: latestCheckin?.calmIndex ?? null,
    domainScores: scores.map((s) => ({ domain: s.domain, score: s.score })),
    latestPrescription: latestPrescription
      ? {
          primaryDomain: latestPrescription.primaryDomain,
          primaryProblem: latestPrescription.primaryProblem,
          weekFocus: latestPrescription.weekFocus,
          watchSignal: latestPrescription.watchSignal,
          createdAt: latestPrescription.createdAt,
        }
      : null,
  };
}

/**
 * Returns all linked client venue summaries for an advisor.
 */
export async function getAdvisorClients(
  advisorId: string
): Promise<AdvisorClientSummary[]> {
  const links = await db.query.advisorClients.findMany({
    where: eq(advisorClients.advisorId, advisorId),
  });

  const summaries: AdvisorClientSummary[] = [];
  for (const link of links) {
    const summary = await getClientSummary(link.venueId);
    if (summary) summaries.push(summary);
  }
  return summaries;
}

/**
 * Link the advisor to the first venue owned by an operator email.
 * This is intentionally simple for the Sprint 6 advisor polish pass:
 * the advisor must know the operator email, and duplicate links are ignored.
 */
export async function linkAdvisorClientByOperatorEmail(input: {
  advisorId: string;
  operatorEmail: string;
}): Promise<AdvisorClientSummary> {
  const email = input.operatorEmail.trim().toLowerCase();
  if (!email) {
    throw new Error("Operator email is required");
  }

  const operator = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!operator) {
    throw new Error("No operator found for that email");
  }

  const venue = await db.query.venues.findFirst({
    where: eq(venues.userId, operator.id),
  });
  if (!venue) {
    throw new Error("That operator has no venue yet");
  }

  const existing = await db.query.advisorClients.findFirst({
    where: and(
      eq(advisorClients.advisorId, input.advisorId),
      eq(advisorClients.venueId, venue.id)
    ),
  });

  if (!existing) {
    await db.insert(advisorClients).values({
      advisorId: input.advisorId,
      venueId: venue.id,
    });
  }

  const summary = await getClientSummary(venue.id);
  if (!summary) {
    throw new Error("Linked venue could not be loaded");
  }
  return summary;
}

/**
 * Returns true if the given venue is linked to the given advisor.
 */
export async function advisorOwnsClient(
  advisorId: string,
  venueId: string
): Promise<boolean> {
  const link = await db.query.advisorClients.findFirst({
    where: and(
      eq(advisorClients.advisorId, advisorId),
      eq(advisorClients.venueId, venueId)
    ),
  });
  return !!link;
}
