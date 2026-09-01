import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@localhost:5432/fake");

const q = vi.hoisted(() => ({
  catalogueSelections: { findMany: vi.fn() },
  venueObligations: { findMany: vi.fn() },
}));

const returning = vi.fn();
const onConflictDoUpdate = vi.fn<(...args: unknown[]) => unknown>(() => ({ returning }));
const values = vi.fn<(...args: unknown[]) => unknown>(() => ({
  onConflictDoUpdate,
  returning,
}));
const insert = vi.fn<(...args: unknown[]) => unknown>(() => ({ values }));
const updateWhere = vi.fn<(...args: unknown[]) => unknown>(() => undefined);
const updateSet = vi.fn<(...args: unknown[]) => unknown>(() => ({ where: updateWhere }));
const update = vi.fn<(...args: unknown[]) => unknown>(() => ({ set: updateSet }));
const deleteWhere = vi.fn<(...args: unknown[]) => unknown>(() => undefined);
const del = vi.fn<(...args: unknown[]) => unknown>(() => ({ where: deleteWhere }));

vi.mock("@/db", () => ({
  db: {
    query: q,
    insert: (...args: unknown[]) => insert(...args),
    update: (...args: unknown[]) => update(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}));

import {
  CatalogueError,
  ceilingMessage,
  getCatalogueState,
  setObligationStatus,
  setSelection,
} from "@/lib/systems/catalogue-selections";
import { MINIMUM_SET_CEILING } from "@/lib/systems/catalogue";

function selection(itemId: string, state: "missing" | "not_working", extra = {}) {
  return {
    itemId,
    state,
    breakpointId: null,
    procedureId: null,
    installOrder: null,
    createdAt: new Date(),
    ...extra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  insert.mockReturnValue({ values });
  values.mockReturnValue({ onConflictDoUpdate, returning });
  onConflictDoUpdate.mockReturnValue({ returning });
  returning.mockResolvedValue([{ id: "row_1" }]);
  update.mockReturnValue({ set: updateSet });
  updateSet.mockReturnValue({ where: updateWhere });
  del.mockReturnValue({ where: deleteWhere });
  q.catalogueSelections.findMany.mockResolvedValue([]);
  q.venueObligations.findMany.mockResolvedValue([]);
});

describe("getCatalogueState", () => {
  it("returns every catalogue item, ticked or not", async () => {
    const state = await getCatalogueState("venue_1", "cafe", []);
    expect(state.entries).toHaveLength(19);
    expect(state.entries.every((e) => e.selection === null)).toBe(true);
  });

  it("attaches the operator's ticks to the right items", async () => {
    q.catalogueSelections.findMany.mockResolvedValueOnce([
      selection("handover", "not_working"),
      selection("welcome", "missing"),
    ]);

    const state = await getCatalogueState("venue_1", "cafe", []);
    const handover = state.entries.find((e) => e.item.id === "handover");
    const welcome = state.entries.find((e) => e.item.id === "welcome");

    expect(handover?.selection?.state).toBe("not_working");
    expect(welcome?.selection?.state).toBe("missing");
  });

  it("offers the venue type's two additions", async () => {
    const state = await getCatalogueState("venue_1", "pub", []);
    expect(state.additions).toHaveLength(2);
    expect(state.additions.map((a) => a.id)).toContain("pub_multi_area_handover");
  });

  it("offers no additions when the venue type is unknown", async () => {
    const state = await getCatalogueState("venue_1", null, []);
    expect(state.additions).toHaveLength(0);
  });

  it("filters obligations by venue type", async () => {
    const cafe = await getCatalogueState("venue_1", "cafe", []);
    expect(cafe.obligations.map((o) => o.obligation.id)).not.toContain("liquor");

    const pub = await getCatalogueState("venue_1", "pub", []);
    expect(pub.obligations.map((o) => o.obligation.id)).toContain("gaming");
  });

  it("counts ticks toward the ceiling but never the optional prompt", async () => {
    q.catalogueSelections.findMany.mockResolvedValueOnce([
      selection("handover", "missing"),
      selection("welcome", "missing"),
      selection("friction_worth_keeping", "missing"),
    ]);

    const state = await getCatalogueState("venue_1", "cafe", []);
    expect(state.ceilingCount).toBe(2);
    expect(state.overCeiling).toBe(false);
  });

  it("flags a venue that has gone past the minimum set", async () => {
    q.catalogueSelections.findMany.mockResolvedValueOnce(
      ["handover", "welcome", "recovery", "fairness", "reinforcement"].map((id) =>
        selection(id, "missing")
      )
    );

    const state = await getCatalogueState("venue_1", "cafe", []);
    expect(state.ceilingCount).toBe(5);
    expect(state.overCeiling).toBe(true);
    expect(state.ceilingCount).toBeGreaterThan(MINIMUM_SET_CEILING);
  });

  it("counts a venue type addition toward the ceiling", async () => {
    q.catalogueSelections.findMany.mockResolvedValueOnce([
      selection("pub_security_handover", "missing"),
    ]);
    const state = await getCatalogueState("venue_1", "pub", []);
    expect(state.ceilingCount).toBe(1);
  });

  it("lists not-working ticks that have not reached the fragility map", async () => {
    q.catalogueSelections.findMany.mockResolvedValueOnce([
      selection("handover", "not_working"),
      selection("welcome", "not_working", { breakpointId: "bp-1" }),
      selection("recovery", "missing"),
    ]);

    const state = await getCatalogueState("venue_1", "cafe", []);
    expect(state.unpromoted.map((s) => s.itemId)).toEqual(["handover"]);
  });

  it("orders by the venue's weakest domains", async () => {
    const state = await getCatalogueState("venue_1", null, ["operational_memory"]);
    const afterBookends = state.entries.slice(2);
    expect(afterBookends[0].item.domain).toBe("operational_memory");
    expect(afterBookends[0].reason).toBe("under_pressure");
  });
});

describe("setSelection", () => {
  it("saves a tick", async () => {
    await setSelection("venue_1", "user_1", "cafe", "handover", "missing");
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: "handover", state: "missing" })
    );
  });

  it("updates rather than duplicating when the same item is re-ticked", async () => {
    await setSelection("venue_1", "user_1", "cafe", "handover", "not_working");
    expect(onConflictDoUpdate).toHaveBeenCalled();
  });

  it("deletes the row when unticked", async () => {
    const result = await setSelection("venue_1", "user_1", "cafe", "handover", null);
    expect(result).toBeNull();
    expect(del).toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("accepts a venue type addition", async () => {
    await expect(
      setSelection("venue_1", "user_1", "pub", "pub_security_handover", "missing")
    ).resolves.toBeDefined();
  });

  it("refuses another venue type's addition", async () => {
    await expect(
      setSelection("venue_1", "user_1", "cafe", "pub_security_handover", "missing")
    ).rejects.toThrow(CatalogueError);
  });

  it("refuses an item that is not in the catalogue at all", async () => {
    await expect(
      setSelection("venue_1", "user_1", "cafe", "make_me_a_sandwich", "missing")
    ).rejects.toThrow(/not an item in your catalogue/);
  });
});

describe("setObligationStatus", () => {
  it("saves a status", async () => {
    await setObligationStatus("venue_1", "user_1", "cafe", "whs", "missing");
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ obligationId: "whs", status: "missing" })
    );
  });

  it("refuses an obligation that does not apply to the venue type", async () => {
    await expect(
      setObligationStatus("venue_1", "user_1", "cafe", "liquor", "missing")
    ).rejects.toThrow(/does not apply/);
  });

  it("allows liquor for a pub", async () => {
    await expect(
      setObligationStatus("venue_1", "user_1", "pub", "liquor", "have")
    ).resolves.toBeDefined();
  });
});

describe("ceilingMessage", () => {
  it("states the count and the reason, and does not refuse", () => {
    const message = ceilingMessage(7);
    expect(message).toContain("You have picked 7");
    expect(message).toContain("three or four");
    expect(message).toContain("keep them in your library");
    expect(message).not.toMatch(/cannot|not allowed|refuse/i);
  });

  it("uses no em dashes", () => {
    expect(ceilingMessage(9)).not.toMatch(/—/);
  });
});
