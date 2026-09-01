/**
 * What the operator ticked, and what happens next.
 *
 * Two ticks per item, both diagnostic. "We do not have one" is a gap.
 * "We have one but it is not working" is a candidate breakpoint, which is the
 * mechanism that keeps the catalogue feeding the fragility map rather than
 * bypassing it.
 *
 * Past the minimum set the module does not refuse. It states the ceiling, asks
 * which few to install first, and starts only those.
 */
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { catalogueSelections, venueObligations } from "@/db/schema";
import type { Domain } from "@/lib/checkin-questions";
import {
  CATALOGUE,
  MINIMUM_SET_CEILING,
  countsTowardCeiling,
  getCatalogueItem,
} from "./catalogue";
import { additionsFor, orderCatalogue, type OrderedCatalogueItem } from "./catalogue-order";
import { obligationsFor, type Obligation } from "./obligations";
import { VENUE_TYPE_PROFILES, type VenueType } from "./venue-types";

export class CatalogueError extends Error {}

export type SelectionState = "missing" | "not_working";
export type ObligationStatus = "have" | "missing" | "sourced";

export interface SelectionRow {
  itemId: string;
  state: SelectionState;
  breakpointId: string | null;
  procedureId: string | null;
  installOrder: number | null;
}

export interface CatalogueEntry extends OrderedCatalogueItem {
  selection: SelectionRow | null;
}

export interface ObligationEntry {
  obligation: Obligation;
  status: ObligationStatus | null;
  notes: string | null;
}

export interface CatalogueState {
  entries: CatalogueEntry[];
  /** Type-specific additions, offered under the core set. */
  additions: { id: string; title: string; domain: Domain; selection: SelectionRow | null }[];
  obligations: ObligationEntry[];
  /** Ticked items that count toward the minimum set. Optional prompts do not. */
  ceilingCount: number;
  overCeiling: boolean;
  /** Ticks that named a problem and have not yet reached the fragility map. */
  unpromoted: SelectionRow[];
}

/** Every valid id an operator can tick: the core set plus this type's additions. */
function validItemIds(venueType: VenueType | null): Set<string> {
  const ids = new Set(CATALOGUE.map((i) => i.id));
  if (venueType) {
    for (const addition of VENUE_TYPE_PROFILES[venueType].additions) ids.add(addition.id);
  }
  return ids;
}

async function loadSelections(venueId: string): Promise<Map<string, SelectionRow>> {
  const rows = await db.query.catalogueSelections.findMany({
    where: eq(catalogueSelections.venueId, venueId),
    orderBy: [asc(catalogueSelections.createdAt)],
  });

  return new Map(
    rows.map((r) => [
      r.itemId,
      {
        itemId: r.itemId,
        state: r.state,
        breakpointId: r.breakpointId,
        procedureId: r.procedureId,
        installOrder: r.installOrder,
      },
    ])
  );
}

export async function getCatalogueState(
  venueId: string,
  venueType: VenueType | null,
  weakestDomains: readonly Domain[]
): Promise<CatalogueState> {
  const [selections, obligationRows] = await Promise.all([
    loadSelections(venueId),
    db.query.venueObligations.findMany({
      where: eq(venueObligations.venueId, venueId),
    }),
  ]);

  const entries: CatalogueEntry[] = orderCatalogue({ venueType, weakestDomains }).map(
    (ordered) => ({ ...ordered, selection: selections.get(ordered.item.id) ?? null })
  );

  const additions = additionsFor(venueType).map((a) => ({
    id: a.id,
    title: a.title,
    domain: a.domain,
    selection: selections.get(a.id) ?? null,
  }));

  const statusById = new Map(obligationRows.map((r) => [r.obligationId, r]));
  const obligations: ObligationEntry[] = obligationsFor(venueType).map((o) => {
    const row = statusById.get(o.id);
    return { obligation: o, status: row?.status ?? null, notes: row?.notes ?? null };
  });

  // Optional prompts never push a venue over the ceiling.
  const ceilingCount = [...selections.values()].filter((s) => {
    const item = getCatalogueItem(s.itemId);
    // Type additions are not in the core catalogue, and they do count.
    return item ? countsTowardCeiling(item) : true;
  }).length;

  const unpromoted = [...selections.values()].filter(
    (s) => s.state === "not_working" && s.breakpointId === null
  );

  return {
    entries,
    additions,
    obligations,
    ceilingCount,
    overCeiling: ceilingCount > MINIMUM_SET_CEILING,
    unpromoted,
  };
}

/**
 * Tick, change or untick one item. Passing `null` removes the row entirely,
 * which is what unticking means.
 */
export async function setSelection(
  venueId: string,
  userId: string,
  venueType: VenueType | null,
  itemId: string,
  state: SelectionState | null
) {
  if (!validItemIds(venueType).has(itemId)) {
    throw new CatalogueError("That is not an item in your catalogue.");
  }

  if (state === null) {
    await db
      .delete(catalogueSelections)
      .where(
        and(
          eq(catalogueSelections.venueId, venueId),
          eq(catalogueSelections.itemId, itemId)
        )
      );
    return null;
  }

  const [row] = await db
    .insert(catalogueSelections)
    .values({ venueId, userId, itemId, state })
    .onConflictDoUpdate({
      target: [catalogueSelections.venueId, catalogueSelections.itemId],
      set: { state, updatedAt: new Date() },
    })
    .returning();

  return row;
}

/**
 * The order the operator chose to install in, when they ticked more than the
 * minimum set. Only these start live; the rest sit in the library.
 */
export async function setInstallOrder(venueId: string, orderedItemIds: readonly string[]) {
  for (const [index, itemId] of orderedItemIds.entries()) {
    await db
      .update(catalogueSelections)
      .set({ installOrder: index + 1, updatedAt: new Date() })
      .where(
        and(
          eq(catalogueSelections.venueId, venueId),
          eq(catalogueSelections.itemId, itemId)
        )
      );
  }
}

/** Record the breakpoint a "not working" tick was promoted into. */
export async function linkSelectionToBreakpoint(
  venueId: string,
  itemId: string,
  breakpointId: string
) {
  await db
    .update(catalogueSelections)
    .set({ breakpointId, updatedAt: new Date() })
    .where(
      and(eq(catalogueSelections.venueId, venueId), eq(catalogueSelections.itemId, itemId))
    );
}

export async function setObligationStatus(
  venueId: string,
  userId: string,
  venueType: VenueType | null,
  obligationId: string,
  status: ObligationStatus,
  notes?: string | null
) {
  const allowed = obligationsFor(venueType).some((o) => o.id === obligationId);
  if (!allowed) {
    throw new CatalogueError("That obligation does not apply to this venue.");
  }

  const [row] = await db
    .insert(venueObligations)
    .values({ venueId, userId, obligationId, status, notes: notes ?? null })
    .onConflictDoUpdate({
      target: [venueObligations.venueId, venueObligations.obligationId],
      set: { status, notes: notes ?? null, updatedAt: new Date() },
    })
    .returning();

  return row;
}

/** The line the module shows when a venue has ticked more than it can sustain. */
export function ceilingMessage(count: number): string {
  return `You have picked ${count}. The minimum system set is three or four, because a small set people follow beats a long one they have learned to ignore. Choose the ones to install first. We will write the rest and keep them in your library.`;
}
