/**
 * Venue-type variation for the catalogue.
 *
 * The nineteen core items do not change by type. What changes is which one
 * further item leads (the welcome and the ending always lead, for everyone),
 * and at most two type-specific additions.
 *
 * Two additions is the ceiling. Past that it becomes a per-type template
 * library and the method is gone.
 */
import type { Domain } from "@/lib/checkin-questions";

export const VENUE_TYPES = [
  "restaurant",
  "cafe",
  "bar",
  "pub",
  "hotel_fb",
  "large_format",
  "other",
] as const;

export type VenueType = (typeof VENUE_TYPES)[number];

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  restaurant: "Restaurant",
  cafe: "Cafe",
  bar: "Bar",
  pub: "Pub",
  hotel_fb: "Hotel food and beverage",
  large_format: "Large format",
  other: "Something else",
};

/**
 * "Other" is a real answer, not a missing one, and the two behave differently.
 *
 * Unset means we have not asked yet, so we show only what applies everywhere and
 * prompt for the type. "Other" means they told us and none of our six fit, so we
 * show everything and let them choose, because a caterer, a club or a food truck
 * could carry liquor or gaming and we have no basis to hide either.
 */
export const UNCLASSIFIED_VENUE_TYPE: VenueType = "other";

export interface TypeAddition {
  id: string;
  title: string;
  domain: Domain;
  cue: string;
  owner: string;
  without: string;
}

export interface VenueTypeProfile {
  /**
   * The one further catalogue item id that leads, beyond the two bookends.
   * Null for "other", where we have no basis to pick one.
   */
  thirdLead: string | null;
  /** At most two. This is a hard ceiling, not a guideline. */
  additions: readonly TypeAddition[];
}

export const VENUE_TYPE_PROFILES: Record<VenueType, VenueTypeProfile> = {
  cafe: {
    thirdLead: "prep_and_roster",
    additions: [
      {
        id: "cafe_morning_rush",
        title: "How the morning rush changeover runs",
        domain: "throughput",
        cue: "The moment the early shift hands the rush to the mid",
        owner: "The early lead, named on the roster",
        without: "The busiest ninety minutes of the day change hands mid-flow.",
      },
      {
        id: "cafe_counter_split",
        title: "How the counter splits takeaway from dine-in",
        domain: "throughput",
        cue: "Two queues forming at the same counter",
        owner: "Whoever runs the counter that shift",
        without: "Takeaway and dine-in compete for the same person and both wait.",
      },
    ],
  },
  restaurant: {
    thirdLead: "handover",
    additions: [
      {
        id: "restaurant_sitting_changeover",
        title: "How a table turns between sittings",
        domain: "pacing",
        cue: "A booked table due to turn",
        owner: "The section server, with the floor lead holding the clock",
        without: "The second sitting waits in the doorway while the first lingers.",
      },
      {
        id: "restaurant_no_show",
        title: "How a no-show or late cancellation is handled",
        domain: "throughput",
        cue: "A booking passing its grace period",
        owner: "Whoever holds the book that shift",
        without: "The table sits empty on your busiest night and nobody called.",
      },
    ],
  },
  bar: {
    thirdLead: "margin_defaults",
    additions: [
      {
        id: "bar_refusal_default",
        title: "How a refusal of service is handled on the floor",
        domain: "defaults",
        cue: "A patron who should not be served another drink",
        owner: "The bar lead, with the decision pre-made rather than argued",
        without:
          "The call is made by whoever is pouring, under pressure, differently every time. This is the operational default, not the licensing obligation, which sits outside our remit.",
      },
      {
        id: "bar_last_drinks",
        title: "How last drinks and close-down run",
        domain: "endings",
        cue: "Last drinks being called",
        owner: "The closing lead, named on the roster",
        without: "Closing is negotiated with the room every night.",
      },
    ],
  },
  pub: {
    thirdLead: "handover",
    additions: [
      {
        id: "pub_multi_area_handover",
        title: "How the handover works across bar, bistro and gaming",
        domain: "throughput",
        cue: "The shift change, in every area at once",
        owner: "One named lead per area, with one person holding the whole",
        without: "Three areas hand over separately and nobody holds the whole picture.",
      },
      {
        id: "pub_security_handover",
        title: "How security and the floor hand over to each other",
        domain: "operational_memory",
        cue: "Security coming on, or an incident being passed on",
        owner: "The duty manager, named",
        without: "What happened at nine is news to whoever is on at eleven.",
      },
    ],
  },
  hotel_fb: {
    thirdLead: "handover",
    additions: [
      {
        id: "hotel_meal_period_transitions",
        title: "How breakfast becomes lunch becomes dinner",
        domain: "pacing",
        cue: "Each meal-period changeover",
        owner: "The outgoing period's lead",
        without: "Each period starts by clearing up after the one before it.",
      },
      {
        id: "hotel_front_office_interface",
        title: "How food and beverage and front office pass information",
        domain: "operational_memory",
        cue: "A guest issue, a VIP arrival, a charge to a room",
        owner: "The duty manager on each side, named",
        without: "The guest tells their story twice and neither side has the whole of it.",
      },
    ],
  },
  /**
   * "Something else" gets the core nineteen and nothing bolted on. Inventing a
   * third lead or type-specific items for a venue we cannot classify would be
   * guessing, and guessing is what the catalogue exists to avoid.
   */
  other: {
    thirdLead: null,
    additions: [],
  },
  large_format: {
    thirdLead: "weekly_shape",
    additions: [
      {
        id: "large_section_lead_handover",
        title: "How section leads hand over to each other",
        domain: "throughput",
        cue: "The shift change within each section",
        owner: "Each section lead, named",
        without: "A big floor hands over as one lump and the detail is lost.",
      },
      {
        id: "large_standard_travels",
        title: "How a standard travels across a big team",
        domain: "people_load",
        cue: "A standard being set or changed",
        owner: "You set it, section leads carry it",
        without: "The standard is known by the people who were in the room that day.",
      },
    ],
  },
};

/** The two bookends, which lead for every venue type. */
export const ALWAYS_LEADING_ITEM_IDS = ["welcome", "bill_and_goodbye"] as const;

export const MAX_TYPE_ADDITIONS = 2;
