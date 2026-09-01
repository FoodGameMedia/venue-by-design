/**
 * The fragility map, as data.
 *
 * The Calm Venue ch.03: list the moments your venue reliably breaks, and for
 * each, the small thing that starts it. "Three to five is plenty: you are
 * looking for the repeat offenders, not every bad night you have ever had."
 *
 * That ceiling is enforced, not suggested. A fragility map that swells into a
 * list of grievances stops being a map.
 */
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { breakpoints } from "@/db/schema";
import type { Domain } from "@/lib/checkin-questions";
import { DOMAINS } from "@/lib/checkin-questions";
import type { BreakpointRef } from "./fragility";
import { MAX_ACTIVE_BREAKPOINTS } from "./limits";

export { MAX_ACTIVE_BREAKPOINTS };

export class BreakpointError extends Error {}

export interface BreakpointInput {
  description: string;
  trigger: string;
  domain?: string | null;
}

function cleanDomain(value: unknown): Domain | null {
  return typeof value === "string" && (DOMAINS as readonly string[]).includes(value)
    ? (value as Domain)
    : null;
}

function cleanText(value: unknown, field: string, max = 300): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new BreakpointError(`${field} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new BreakpointError(`${field} must be ${max} characters or fewer.`);
  }
  return trimmed;
}

export async function listBreakpoints(venueId: string): Promise<BreakpointRef[]> {
  const rows = await db.query.breakpoints.findMany({
    where: and(eq(breakpoints.venueId, venueId), isNull(breakpoints.resolvedAt)),
    orderBy: [asc(breakpoints.createdAt)],
  });

  return rows.map((r) => ({
    id: r.id,
    description: r.description,
    trigger: r.trigger,
    domain: r.domain as Domain | null,
  }));
}

/** Every breakpoint, resolved ones included, for the map screen. */
export async function listAllBreakpoints(venueId: string) {
  return db.query.breakpoints.findMany({
    where: eq(breakpoints.venueId, venueId),
    orderBy: [asc(breakpoints.createdAt)],
  });
}

export async function createBreakpoint(
  venueId: string,
  userId: string,
  input: BreakpointInput
) {
  const description = cleanText(input.description, "The breakpoint");
  const trigger = cleanText(input.trigger, "The trigger");

  const active = await listBreakpoints(venueId);
  if (active.length >= MAX_ACTIVE_BREAKPOINTS) {
    throw new BreakpointError(
      `You already have ${MAX_ACTIVE_BREAKPOINTS} open breakpoints. Design one out before adding another, that is the point of the map.`
    );
  }

  const [row] = await db
    .insert(breakpoints)
    .values({
      venueId,
      userId,
      description,
      trigger,
      domain: cleanDomain(input.domain),
    })
    .returning();

  return row;
}

export async function updateBreakpoint(
  id: string,
  venueId: string,
  patch: Partial<BreakpointInput> & { resolved?: boolean }
) {
  const existing = await db.query.breakpoints.findFirst({
    where: and(eq(breakpoints.id, id), eq(breakpoints.venueId, venueId)),
  });

  if (!existing) {
    throw new BreakpointError("Breakpoint not found.");
  }

  const values: Record<string, unknown> = { updatedAt: new Date() };

  if (patch.description !== undefined) {
    values.description = cleanText(patch.description, "The breakpoint");
  }
  if (patch.trigger !== undefined) {
    values.trigger = cleanText(patch.trigger, "The trigger");
  }
  if (patch.domain !== undefined) {
    values.domain = cleanDomain(patch.domain);
  }
  if (patch.resolved !== undefined) {
    values.resolvedAt = patch.resolved ? new Date() : null;
  }

  const [row] = await db
    .update(breakpoints)
    .set(values)
    .where(eq(breakpoints.id, id))
    .returning();

  return row;
}
