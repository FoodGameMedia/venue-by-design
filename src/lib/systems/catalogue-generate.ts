/**
 * Turning a tick into something real.
 *
 * Two paths out of the catalogue screen:
 *  - A "not working" tick becomes a breakpoint on the fragility map. That is
 *    what stops the catalogue from bypassing the diagnosis.
 *  - Any tick becomes a procedure, drafted from the interview and grounded in
 *    the relevant chapters through the book retrieval layer.
 *
 * Everything generated lands as `draft`. It still faces the three method
 * questions, and it still cannot reach `installed` without a rostered-off
 * record.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { catalogueSelections, procedureVersions, procedures } from "@/db/schema";
import { formatBookExcerpts, retrieveBookChunks } from "@/lib/book-retrieval";
import { getCatalogueItem } from "./catalogue";
import { CatalogueError } from "./catalogue-selections";
import { createBreakpoint, listBreakpoints } from "./breakpoints";
import { draftProcedure, type InterviewSubject } from "./procedure-draft";
import { VENUE_TYPE_PROFILES, type VenueType } from "./venue-types";

/** Core item or venue-type addition, in the shape the interview needs. */
export function subjectFor(itemId: string, venueType: VenueType | null): InterviewSubject | null {
  const core = getCatalogueItem(itemId);
  if (core) {
    return {
      itemId: core.id,
      title: core.title,
      domain: core.domain,
      suggestedCue: core.cue,
      suggestedOwner: core.owner,
    };
  }

  if (!venueType) return null;
  const addition = VENUE_TYPE_PROFILES[venueType].additions.find((a) => a.id === itemId);
  if (!addition) return null;

  return {
    itemId: addition.id,
    title: addition.title,
    domain: addition.domain,
    suggestedCue: addition.cue,
    suggestedOwner: addition.owner,
  };
}

async function selectionFor(venueId: string, itemId: string) {
  const row = await db.query.catalogueSelections.findFirst({
    where: and(
      eq(catalogueSelections.venueId, venueId),
      eq(catalogueSelections.itemId, itemId)
    ),
  });
  if (!row) throw new CatalogueError("You have not ticked that one yet.");
  return row;
}

/**
 * Promote a "not working" tick onto the fragility map.
 *
 * The operator supplies the trigger, because chapter 3 is explicit that a
 * breakpoint without the small thing that starts it is only half a map entry.
 * The five-breakpoint ceiling still applies, and says so.
 */
export async function promoteToBreakpoint(
  venueId: string,
  userId: string,
  venueType: VenueType | null,
  itemId: string,
  trigger: string,
  /** Link to one the operator already named instead of creating a duplicate. */
  existingBreakpointId?: string | null
) {
  const subject = subjectFor(itemId, venueType);
  if (!subject) throw new CatalogueError("That is not an item in your catalogue.");

  const selection = await selectionFor(venueId, itemId);
  if (selection.state !== "not_working") {
    throw new CatalogueError(
      "Only something you have and that is not working belongs on the fragility map. A gap is not a breakpoint."
    );
  }
  if (selection.breakpointId) {
    throw new CatalogueError("That one is already on your fragility map.");
  }

  // Linking to an existing breakpoint costs no slot and avoids describing the
  // same bad night twice, which was burning two of the five.
  if (existingBreakpointId) {
    const existing = (await listBreakpoints(venueId)).find(
      (b) => b.id === existingBreakpointId
    );
    if (!existing) throw new CatalogueError("That breakpoint is not on your map.");

    await db
      .update(catalogueSelections)
      .set({ breakpointId: existing.id, updatedAt: new Date() })
      .where(eq(catalogueSelections.id, selection.id));

    return existing;
  }

  const breakpoint = await createBreakpoint(venueId, userId, {
    description: subject.title,
    trigger,
    domain: subject.domain,
  });

  await db
    .update(catalogueSelections)
    .set({ breakpointId: breakpoint.id, updatedAt: new Date() })
    .where(eq(catalogueSelections.id, selection.id));

  return breakpoint;
}

export interface GenerateInput {
  venueId: string;
  userId: string;
  venueName: string;
  venueType: VenueType | null;
  itemId: string;
  answers: Record<string, string>;
}

/**
 * Draft the procedure and store it.
 *
 * Provenance is `generated`, which is how the library later tells something we
 * wrote from something the venue already had.
 */
export async function generateFromSelection(input: GenerateInput, client?: Anthropic) {
  const subject = subjectFor(input.itemId, input.venueType);
  if (!subject) throw new CatalogueError("That is not an item in your catalogue.");

  const selection = await selectionFor(input.venueId, input.itemId);
  if (selection.procedureId) {
    throw new CatalogueError("We have already written that one.");
  }

  // Attach the breakpoint if this tick has been promoted, so the draft knows
  // what it exists to fix.
  if (selection.breakpointId) {
    const breakpoints = await listBreakpoints(input.venueId);
    const match = breakpoints.find((b) => b.id === selection.breakpointId);
    if (match) {
      subject.breakpoint = { description: match.description, trigger: match.trigger };
    }
  }

  // Ground the draft in the chapters that actually cover this moment. Retrieval
  // failing is not fatal: a draft without excerpts is still on-method because
  // the system prompt carries the method.
  const excerpts = await retrieveBookChunks(`${subject.title} ${subject.suggestedCue}`, 4);
  const bookExcerpts = excerpts.length > 0 ? formatBookExcerpts(excerpts) : undefined;

  const draft = await draftProcedure(
    {
      subject,
      venueName: input.venueName,
      venueType: input.venueType,
      answers: input.answers,
      bookExcerpts,
    },
    client
  );

  const [procedure] = await db
    .insert(procedures)
    .values({
      venueId: input.venueId,
      userId: input.userId,
      title: draft.title,
      domain: subject.domain,
      breakpointId: selection.breakpointId,
      theDefault: draft.fields.theDefault,
      cue: draft.fields.cue,
      routine: draft.fields.routine,
      reinforcement: draft.fields.reinforcement,
      ownerRole: draft.fields.ownerRole,
      reviewCadence: draft.fields.reviewCadence,
      provenance: "generated",
      status: "draft",
    })
    .returning();

  if (!procedure) throw new CatalogueError("Could not save that procedure.");

  const body = [
    draft.title,
    draft.fields.theDefault ? `The default: ${draft.fields.theDefault}` : "",
    draft.fields.cue ? `Cue: ${draft.fields.cue}` : "",
    ...draft.fields.routine.map((step, i) => `${i + 1}. ${step}`),
    draft.fields.reinforcement ? `Reinforcement: ${draft.fields.reinforcement}` : "",
    draft.fields.ownerRole ? `Owner: ${draft.fields.ownerRole}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const [version] = await db
    .insert(procedureVersions)
    .values({
      procedureId: procedure.id,
      versionNumber: 1,
      body,
      fields: draft.fields,
      extractedFrom: {
        method: "catalogue",
        catalogueItemId: subject.itemId,
        answered: Object.keys(input.answers).filter((k) => input.answers[k]?.trim()),
      },
      authoredBy: "ai_draft",
    })
    .returning();

  await db
    .update(procedures)
    .set({ currentVersionId: version.id, updatedAt: new Date() })
    .where(eq(procedures.id, procedure.id));

  await db
    .update(catalogueSelections)
    .set({ procedureId: procedure.id, updatedAt: new Date() })
    .where(eq(catalogueSelections.id, selection.id));

  return { procedure, draft };
}
