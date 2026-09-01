/**
 * Which items lead, and why.
 *
 * This is the part no competitor can copy. A tick-box list of SOPs is a
 * commodity. A list ordered by the venue's own Calm Index, with its two
 * weakest domains floated to the top, is their list.
 *
 * Order of precedence:
 *  1. The two bookends, the welcome and the ending, always lead.
 *  2. The venue type's third lead.
 *  3. Items in the venue's two weakest domains.
 *  4. Everything else, in catalogue order.
 *
 * Optional prompts rank normally by domain. Optional governs the ceiling, not
 * visibility: burying the loose item at the bottom meant nobody would ever see
 * it, which defeats the point of keeping it.
 */
import type { Domain } from "@/lib/checkin-questions";
import { CATALOGUE, type CatalogueItem } from "./catalogue";
import {
  ALWAYS_LEADING_ITEM_IDS,
  VENUE_TYPE_PROFILES,
  type TypeAddition,
  type VenueType,
} from "./venue-types";

export interface OrderedCatalogueItem {
  item: CatalogueItem;
  /** Why it is where it is. Shown as a small label beside suggested items. */
  reason: "bookend" | "venue_type" | "under_pressure" | null;
  /** Pre-ticked as a suggestion. The operator can always untick. */
  suggested: boolean;
}

export interface CatalogueOrderInput {
  venueType: VenueType | null;
  /** The venue's two weakest domains, weakest first. May be empty. */
  weakestDomains: readonly Domain[];
}

export function orderCatalogue(input: CatalogueOrderInput): OrderedCatalogueItem[] {
  const bookends = new Set<string>(ALWAYS_LEADING_ITEM_IDS);
  const thirdLead = input.venueType
    ? VENUE_TYPE_PROFILES[input.venueType].thirdLead
    : null;
  const weak = new Set<Domain>(input.weakestDomains);

  function rank(item: CatalogueItem): number {
    if (bookends.has(item.id)) return 0;
    if (item.id === thirdLead) return 1;
    if (weak.has(item.domain)) return 2;
    return 3;
  }

  function reasonFor(item: CatalogueItem): OrderedCatalogueItem["reason"] {
    if (bookends.has(item.id)) return "bookend";
    if (item.id === thirdLead) return "venue_type";
    if (weak.has(item.domain)) return "under_pressure";
    return null;
  }

  const indexed = CATALOGUE.map((item, index) => ({ item, index }));

  indexed.sort((a, b) => {
    const byRank = rank(a.item) - rank(b.item);
    if (byRank !== 0) return byRank;
    // Within a rank, keep catalogue order so the list does not shuffle.
    return a.index - b.index;
  });

  return indexed.map(({ item }) => {
    const reason = reasonFor(item);
    return { item, reason, suggested: reason !== null };
  });
}

/** The type-specific additions, offered alongside the core set. */
export function additionsFor(venueType: VenueType | null): readonly TypeAddition[] {
  if (!venueType) return [];
  return VENUE_TYPE_PROFILES[venueType].additions;
}

export const ORDER_REASON_LABELS: Record<
  NonNullable<OrderedCatalogueItem["reason"]>,
  string
> = {
  bookend: "Everyone needs this",
  venue_type: "Common in your kind of venue",
  under_pressure: "One of your weakest domains",
};
