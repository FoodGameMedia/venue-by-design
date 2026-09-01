/**
 * The SOP catalogue.
 *
 * Canonical from `claude/SystemsModule_SOPCatalogue_v1_0_202609020017.md`,
 * approved by Julian item by item on 1 to 2 September 2026. Every core item is
 * a chapter's own "habit to install" from The Calm Venue, which is what keeps
 * this a method rather than a template library.
 *
 * Changing an item's wording changes the product. It changes on the record
 * first, never here alone.
 */
import type { Domain } from "@/lib/checkin-questions";
import type { VenueType } from "./venue-types";

/** The thesis the catalogue opens with, before any item. Chapter 24. */
export const CATALOGUE_LEAD = {
  paragraphs: [
    "Every procedure here exists for one reason: to turn something you care about into something that happens without anyone having to choose it.",
    "When you catch yourself reminding the team to care, that is not a training problem. It is a design signal. The reminder is telling you a default is missing.",
    "Tick the moments where that is true in your venue. We will write the default.",
  ],
  attribution:
    "Turning a value into a default is a design job, not a motivational one.",
} as const;

export type CatalogueGroup = "systems_flow" | "people_memory" | "operational_memory";

export interface CatalogueItem {
  /** Stable id. Persisted in venue selections, so it never changes. */
  id: string;
  group: CatalogueGroup;
  /** The moment, not the document. This is what the operator ticks. */
  title: string;
  domain: Domain;
  /** The fixed point in the day the procedure attaches to. */
  cue: string;
  /** A named role, never "everyone". */
  owner: string;
  /** What a venue without it looks like. Shown under the title. */
  without: string;
  /**
   * Optional items are prompts rather than procedures. They do not count
   * toward the minimum-set ceiling, and nothing is lost by ticking one.
   */
  optional?: true;
  /**
   * Leads for every venue type regardless of Calm Index. The two bookends:
   * the book weights the peak and the end, and the welcome is the other end.
   */
  alwaysLeads?: true;
}

export const CATALOGUE: readonly CatalogueItem[] = [
  // ── Systems and Flow ────────────────────────────────────────────────────────
  {
    id: "handover",
    group: "systems_flow",
    title: "How one shift hands over to the next",
    domain: "throughput",
    cue: "The shift change, a fixed moment on the clock",
    owner: "Outgoing shift lead, named on the roster",
    without:
      "The next shift finds out about lunch's problem when a guest complains about it.",
  },
  {
    id: "prep_and_roster",
    group: "systems_flow",
    title: "How you set prep and roster for a service",
    domain: "pacing",
    cue: "The moment prep and roster are set",
    owner: "Whoever sets prep and roster",
    without: "You plan to the midpoint, so every busy night arrives as a surprise.",
  },
  {
    id: "weekly_shape",
    group: "systems_flow",
    title: "How the week is shaped before it starts",
    domain: "pacing",
    cue: "The weekly review, the same fixed moment each week",
    owner: "You, with each day owned by whoever runs it",
    without:
      "The heavy non-trading work lands on the days you can least afford to lose.",
  },
  {
    id: "protected_time",
    group: "systems_flow",
    title: "How the owner's own time is protected",
    domain: "defaults",
    cue: "A fixed block each week, booked like a train path",
    owner: "You, with floor cover named in advance",
    without:
      "No hour of the week is uninterruptible, so nothing important ever gets built.",
  },
  {
    id: "the_wait",
    group: "systems_flow",
    title: "How a guest is told what to expect while waiting",
    domain: "throughput",
    cue: "The moment a wait begins",
    owner: "Whoever owns that touchpoint, the host at the door or the server at the table",
    without:
      "The wait is silent, and silence is what people complain about, not the wait itself.",
  },
  {
    id: "margin_defaults",
    group: "systems_flow",
    title: "How margin decisions are made on the floor",
    domain: "defaults",
    cue: "A portion, a comp or a price being decided",
    owner: "You set the default, the floor follows it",
    without:
      "Portions, comps and prices are judgement calls made by whoever is standing there.",
  },

  // ── People and Memory ───────────────────────────────────────────────────────
  {
    id: "welcome",
    group: "people_memory",
    title: "How a guest is welcomed in the first ninety seconds",
    domain: "signals",
    cue: "A guest crossing the threshold",
    owner: "Whoever owns the door on that shift, named on the roster",
    without:
      "Acknowledgement depends on who happens to look up, and some guests wait unseen.",
    alwaysLeads: true,
  },
  {
    id: "response_to_failure",
    group: "people_memory",
    title: "How a mistake or complaint is responded to",
    domain: "people_load",
    cue: "A mistake, breakage, complaint or near miss being surfaced",
    owner: "You, because the tone is set by how the top responds to bad news",
    without: "People stop surfacing bad news, and you find out late.",
  },
  {
    id: "fairness",
    group: "people_memory",
    title: "How rosters, tips and leave are allocated",
    domain: "people_load",
    cue: "Any moment you allocate something people value",
    owner: "You author the mechanism, the mechanism does the allocating",
    without: "Every allocation is a judgement someone can resent.",
  },
  {
    id: "reinforcement",
    group: "people_memory",
    title: "How a standard is reinforced week to week",
    domain: "people_load",
    cue: "The pre-service gathering",
    owner: "Whoever runs the pre-service, named",
    without: "Training is an event at induction and nothing after it.",
  },
  {
    id: "the_room_and_the_line",
    group: "people_memory",
    title: "How the room is opened and what it says",
    domain: "signals",
    cue: "The moment before the first guest, and the moment a signature plate is set down",
    owner: "Whoever opens the room, and every server for the line",
    without:
      "The first guest walks into whatever the day left behind, and the value story depends on which server they get.",
  },
  {
    id: "complexity_budget",
    group: "people_memory",
    title: "How menu additions are paid for",
    domain: "signals",
    cue: "Any proposal to add an item, option or modification",
    owner: "You, as keeper of the budget",
    without: "The menu only grows, and the kitchen absorbs every addition.",
  },
  {
    id: "friction_worth_keeping",
    group: "people_memory",
    title: "Which friction is kept on purpose",
    domain: "signals",
    cue: "Any proposal to make something smoother or faster for the guest",
    owner: "You, because telling waste from worth is a judgement the venue owns",
    without: "You smooth away the things that were quietly doing work.",
    optional: true,
  },
  {
    id: "bill_and_goodbye",
    group: "people_memory",
    title: "How the bill and the goodbye are handled",
    domain: "endings",
    cue: "The bill is asked for, or a guest stands and reaches for a coat",
    owner: "Named on every roster. The door is someone's.",
    without:
      "A goodbye that belongs to everyone belongs to no one, and the last ten minutes undo the rest.",
    alwaysLeads: true,
  },
  {
    id: "recovery",
    group: "people_memory",
    title: "How a known failure is recovered",
    domain: "endings",
    cue: "A returned dish, a lost booking, a long wait, a spill",
    owner: "You design it, the floor runs it without needing to find you",
    without: "Every returned dish is negotiated from scratch, usually by finding you.",
  },

  // ── Operational Memory ──────────────────────────────────────────────────────
  {
    id: "exceptions_register",
    group: "operational_memory",
    title: "How exceptions and one-off calls are captured",
    domain: "operational_memory",
    cue: "Something non-standard happens or is decided",
    owner: "Everyone captures it, you keep it low friction enough that they do",
    without:
      "The substitution, the allergy and the workaround leave with whoever was on that night.",
  },
  {
    id: "compliance_in_the_day",
    group: "operational_memory",
    title: "How compliance steps get done and recorded",
    domain: "operational_memory",
    cue: "An existing fixed point in the day: opening, close, a delivery",
    owner: "Whoever owns that routine, named",
    without:
      "The log is reconstructed on Friday for an inspector rather than done at the time.",
  },
  {
    id: "equipment_layer",
    group: "operational_memory",
    title: "How critical equipment is watched",
    domain: "operational_memory",
    cue: "The routine moment its condition could be checked or monitored",
    owner: "You decide what is watched, the system or the routine does the watching",
    without: "You find out the coolroom is failing when the stock is already gone.",
  },
  {
    id: "memory_layer",
    group: "operational_memory",
    title: "How knowledge survives a person leaving",
    domain: "operational_memory",
    cue: "A problem solved, a decision made, a person about to leave",
    owner: "You, until the memory layer is established enough to share",
    without: "A resignation takes the operation's memory out the door with it.",
  },
] as const;

/** The minimum system set: three or four. Past this the module pushes back. */
export const MINIMUM_SET_CEILING = 4;

export const CATALOGUE_GROUP_LABELS: Record<CatalogueGroup, string> = {
  systems_flow: "Systems and Flow",
  people_memory: "People and Memory",
  operational_memory: "Operational Memory",
};

export function getCatalogueItem(id: string): CatalogueItem | undefined {
  return CATALOGUE.find((item) => item.id === id);
}

/** Items that count toward the ceiling. Optional prompts do not. */
export function countsTowardCeiling(item: CatalogueItem): boolean {
  return item.optional !== true;
}

export function itemsByGroup(group: CatalogueGroup): CatalogueItem[] {
  return CATALOGUE.filter((item) => item.group === group);
}

export { type VenueType };
