import { describe, expect, it } from "vitest";
import {
  CATALOGUE,
  CATALOGUE_GROUP_LABELS,
  CATALOGUE_LEAD,
  MINIMUM_SET_CEILING,
  countsTowardCeiling,
  getCatalogueItem,
  itemsByGroup,
} from "@/lib/systems/catalogue";
import { DOMAINS } from "@/lib/checkin-questions";
import {
  ALWAYS_LEADING_ITEM_IDS,
  MAX_TYPE_ADDITIONS,
  VENUE_TYPES,
  VENUE_TYPE_PROFILES,
} from "@/lib/systems/venue-types";
import {
  ORDER_REASON_LABELS,
  additionsFor,
  orderCatalogue,
} from "@/lib/systems/catalogue-order";
import { OBLIGATIONS, obligationPrompt, obligationsFor } from "@/lib/systems/obligations";

/**
 * The catalogue is the product. These tests exist so it cannot drift without
 * someone deliberately changing them, and so the cuts Julian made on
 * 1 to 2 September stay cut.
 */
describe("catalogue shape", () => {
  it("holds nineteen items, six, nine and four", () => {
    expect(CATALOGUE).toHaveLength(19);
    expect(itemsByGroup("systems_flow")).toHaveLength(6);
    expect(itemsByGroup("people_memory")).toHaveLength(9);
    expect(itemsByGroup("operational_memory")).toHaveLength(4);
  });

  it("keeps the cut items out", () => {
    const ids = CATALOGUE.map((i) => i.id);
    // Cut: a meta-procedure about procedures, the audit is that.
    expect(ids).not.toContain("minimum_system_set");
    // Cut: already a built feature at /systems/breakpoints.
    expect(ids).not.toContain("fragility_map_current");
    // Promoted to the leading statement, not an item.
    expect(ids).not.toContain("customer_first_default");
    // Merged into the_room_and_the_line.
    expect(ids).not.toContain("value_story");
  });

  it("gives every item a unique id", () => {
    const ids = CATALOGUE.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every item a real domain, cue, owner and consequence", () => {
    for (const item of CATALOGUE) {
      expect(DOMAINS).toContain(item.domain);
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.cue.length).toBeGreaterThan(0);
      expect(item.owner.length).toBeGreaterThan(0);
      expect(item.without.length).toBeGreaterThan(0);
    }
  });

  it("never names everyone as an owner", () => {
    for (const item of CATALOGUE) {
      expect(item.owner.toLowerCase()).not.toBe("everyone");
    }
  });

  it("uses no em dashes anywhere in the copy", () => {
    const copy = [
      ...CATALOGUE_LEAD.paragraphs,
      CATALOGUE_LEAD.attribution,
      ...CATALOGUE.flatMap((i) => [i.title, i.cue, i.owner, i.without]),
      ...Object.values(CATALOGUE_GROUP_LABELS),
    ].join(" ");
    expect(copy).not.toMatch(/—/);
  });

  it("marks exactly one item optional, the loose one", () => {
    const optional = CATALOGUE.filter((i) => i.optional);
    expect(optional).toHaveLength(1);
    expect(optional[0].id).toBe("friction_worth_keeping");
    expect(countsTowardCeiling(optional[0])).toBe(false);
  });

  it("marks the two bookends as always leading", () => {
    const leads = CATALOGUE.filter((i) => i.alwaysLeads).map((i) => i.id);
    expect(leads.sort()).toEqual(["bill_and_goodbye", "welcome"]);
    expect([...ALWAYS_LEADING_ITEM_IDS].sort()).toEqual(["bill_and_goodbye", "welcome"]);
  });

  it("holds the minimum set at four", () => {
    expect(MINIMUM_SET_CEILING).toBe(4);
  });

  it("finds an item by id and misses cleanly", () => {
    expect(getCatalogueItem("welcome")?.domain).toBe("signals");
    expect(getCatalogueItem("not_a_real_item")).toBeUndefined();
  });
});

describe("venue types", () => {
  it("covers every venue type in the schema", () => {
    for (const type of VENUE_TYPES) {
      expect(VENUE_TYPE_PROFILES[type]).toBeDefined();
    }
  });

  it("gives each classified type exactly two additions, never more", () => {
    for (const type of VENUE_TYPES) {
      const expected = type === "other" ? 0 : MAX_TYPE_ADDITIONS;
      expect(VENUE_TYPE_PROFILES[type].additions).toHaveLength(expected);
    }
  });

  it("gives Something else the core set and nothing bolted on", () => {
    // Inventing a lead or additions for a venue we cannot classify is guessing.
    expect(VENUE_TYPE_PROFILES.other.thirdLead).toBeNull();
    expect(VENUE_TYPE_PROFILES.other.additions).toHaveLength(0);
  });

  it("points every third lead at a real catalogue item", () => {
    for (const type of VENUE_TYPES) {
      const lead = VENUE_TYPE_PROFILES[type].thirdLead;
      if (lead === null) continue;
      expect(getCatalogueItem(lead)).toBeDefined();
    }
  });

  it("never makes a bookend the third lead, that would waste it", () => {
    for (const type of VENUE_TYPES) {
      const lead = VENUE_TYPE_PROFILES[type].thirdLead;
      if (lead === null) continue;
      expect(ALWAYS_LEADING_ITEM_IDS).not.toContain(lead);
    }
  });

  it("keeps addition ids unique across all types", () => {
    const ids = VENUE_TYPES.flatMap((t) =>
      VENUE_TYPE_PROFILES[t].additions.map((a) => a.id)
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses no em dashes in addition copy", () => {
    const copy = VENUE_TYPES.flatMap((t) =>
      VENUE_TYPE_PROFILES[t].additions.flatMap((a) => [a.title, a.cue, a.owner, a.without])
    ).join(" ");
    expect(copy).not.toMatch(/—/);
  });
});

describe("orderCatalogue", () => {
  it("puts the two bookends first, for every venue type", () => {
    for (const type of VENUE_TYPES) {
      const ordered = orderCatalogue({ venueType: type, weakestDomains: [] });
      const firstTwo = ordered.slice(0, 2).map((o) => o.item.id).sort();
      expect(firstTwo).toEqual(["bill_and_goodbye", "welcome"]);
    }
  });

  it("puts the venue type's third lead immediately after the bookends", () => {
    const ordered = orderCatalogue({ venueType: "bar", weakestDomains: [] });
    expect(ordered[2].item.id).toBe("margin_defaults");
    expect(ordered[2].reason).toBe("venue_type");
  });

  it("floats the weakest domains above everything else", () => {
    const ordered = orderCatalogue({
      venueType: null,
      weakestDomains: ["operational_memory"],
    });
    const afterBookends = ordered.slice(2);
    const firstNonBookend = afterBookends[0];
    expect(firstNonBookend.item.domain).toBe("operational_memory");
    expect(firstNonBookend.reason).toBe("under_pressure");
  });

  it("ranks the optional prompt by domain like any other item", () => {
    // friction_worth_keeping is a Signals item. With Signals under pressure it
    // should surface with the rest of Signals, not be buried at the bottom.
    const ordered = orderCatalogue({
      venueType: "cafe",
      weakestDomains: ["signals"],
    });
    const entry = ordered.find((o) => o.item.id === "friction_worth_keeping");
    expect(entry?.reason).toBe("under_pressure");
    expect(entry?.suggested).toBe(true);
    expect(ordered.at(-1)?.item.id).not.toBe("friction_worth_keeping");
  });

  it("keeps the optional prompt out of the ceiling count even when it ranks high", () => {
    const ordered = orderCatalogue({ venueType: "cafe", weakestDomains: ["signals"] });
    const entry = ordered.find((o) => o.item.id === "friction_worth_keeping");
    expect(entry?.item.optional).toBe(true);
    expect(countsTowardCeiling(entry!.item)).toBe(false);
  });

  it("suggests only what it has a reason for", () => {
    const ordered = orderCatalogue({ venueType: "cafe", weakestDomains: ["pacing"] });
    for (const entry of ordered) {
      expect(entry.suggested).toBe(entry.reason !== null);
    }
  });

  it("returns every item exactly once, whatever the input", () => {
    const ordered = orderCatalogue({
      venueType: "pub",
      weakestDomains: ["throughput", "endings"],
    });
    expect(ordered).toHaveLength(CATALOGUE.length);
    expect(new Set(ordered.map((o) => o.item.id)).size).toBe(CATALOGUE.length);
  });

  it("gives Something else the bookends and no third lead", () => {
    const ordered = orderCatalogue({ venueType: "other", weakestDomains: [] });
    expect(ordered.slice(0, 2).map((o) => o.item.id).sort()).toEqual([
      "bill_and_goodbye",
      "welcome",
    ]);
    expect(ordered.filter((o) => o.reason === "venue_type")).toHaveLength(0);
  });

  it("copes with a brand new venue that has no type and no scores", () => {
    const ordered = orderCatalogue({ venueType: null, weakestDomains: [] });
    expect(ordered).toHaveLength(CATALOGUE.length);
    expect(ordered.slice(0, 2).map((o) => o.item.id).sort()).toEqual([
      "bill_and_goodbye",
      "welcome",
    ]);
  });

  it("labels every reason it can give", () => {
    for (const reason of ["bookend", "venue_type", "under_pressure"] as const) {
      expect(ORDER_REASON_LABELS[reason].length).toBeGreaterThan(0);
    }
  });
});

describe("additionsFor", () => {
  it("returns two for a classified type and none otherwise", () => {
    expect(additionsFor("pub")).toHaveLength(2);
    expect(additionsFor(null)).toHaveLength(0);
    expect(additionsFor("other")).toHaveLength(0);
  });
});

describe("obligations", () => {
  it("lists seventeen headings", () => {
    expect(OBLIGATIONS).toHaveLength(17);
  });

  it("gives every heading an authority and at least one venue type", () => {
    for (const o of OBLIGATIONS) {
      expect(o.heading.length).toBeGreaterThan(0);
      expect(o.authority.length).toBeGreaterThan(0);
      expect(o.appliesTo.length).toBeGreaterThan(0);
    }
  });

  it("keeps liquor away from a cafe and gaming away from a restaurant", () => {
    const cafe = obligationsFor("cafe").map((o) => o.id);
    expect(cafe).not.toContain("liquor");
    expect(cafe).not.toContain("gaming");

    const restaurant = obligationsFor("restaurant").map((o) => o.id);
    expect(restaurant).toContain("liquor");
    expect(restaurant).not.toContain("gaming");

    expect(obligationsFor("pub").map((o) => o.id)).toContain("gaming");
  });

  it("applies pay, safety and tax to every type", () => {
    for (const type of VENUE_TYPES) {
      const ids = obligationsFor(type).map((o) => o.id);
      expect(ids).toContain("pay_rates");
      expect(ids).toContain("whs");
      expect(ids).toContain("tax_and_bas");
    }
  });

  // Unset and "other" are different answers and must behave differently.
  it("shows only the universal headings when the type is not set yet", () => {
    const ids = obligationsFor(null).map((o) => o.id);
    expect(ids).not.toContain("liquor");
    expect(ids).not.toContain("gaming");
    expect(ids).toHaveLength(OBLIGATIONS.length - 2);
  });

  it("shows everything for Something else, because we cannot rule anything out", () => {
    expect(obligationsFor("other")).toHaveLength(OBLIGATIONS.length);
    expect(obligationsFor("other").map((o) => o.id)).toContain("gaming");
  });

  it("points at the authority and never offers to write the policy", () => {
    for (const o of OBLIGATIONS) {
      const prompt = obligationPrompt(o).toLowerCase();
      expect(prompt).toContain("we will not write it");
      expect(prompt).toContain(o.authority.toLowerCase());
      expect(prompt).not.toMatch(/here is your (policy|procedure)/);
    }
  });

  it("uses no em dashes", () => {
    const copy = OBLIGATIONS.flatMap((o) => [o.heading, o.authority, obligationPrompt(o)]).join(
      " "
    );
    expect(copy).not.toMatch(/—/);
  });
});
