import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@localhost:5432/fake");

const mockWhere = vi.fn();
// The audit count joins twice before it filters, so innerJoin chains into
// itself. Everything else goes straight from `from` to `where`. The explicit
// type is required: a function that returns itself cannot be inferred.
interface Chain {
  innerJoin: (...args: unknown[]) => Chain;
  where: typeof mockWhere;
}
const mockInnerJoin: (...args: unknown[]) => Chain = vi.fn(() => chain);
const chain: Chain = { innerJoin: mockInnerJoin, where: mockWhere };
const mockFrom = vi.fn<(...args: unknown[]) => unknown>(() => ({
  where: mockWhere,
  innerJoin: mockInnerJoin,
}));
const mockSelect = vi.fn<(...args: unknown[]) => unknown>(() => ({ from: mockFrom }));

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

import {
  HOURLY_LIMITS,
  SpendLimitError,
  assertWithinSpendLimit,
} from "@/lib/systems/spend-limits";

/** The count query resolves to a single row shaped `{ value }`. */
function used(n: number) {
  mockWhere.mockResolvedValueOnce([{ value: n }]);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({ from: mockFrom });
  mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin });
  vi.mocked(mockInnerJoin).mockReturnValue(chain);
});

describe("assertWithinSpendLimit", () => {
  const actions = ["generate", "ingest", "audit"] as const;

  it.each(actions)("lets %s through below the ceiling", async (action) => {
    used(HOURLY_LIMITS[action] - 1);
    await expect(assertWithinSpendLimit(action, "venue_1")).resolves.toBeUndefined();
  });

  it.each(actions)("stops %s at the ceiling", async (action) => {
    used(HOURLY_LIMITS[action]);
    await expect(assertWithinSpendLimit(action, "venue_1")).rejects.toThrow(SpendLimitError);
  });

  it.each(actions)("stops %s above the ceiling", async (action) => {
    used(HOURLY_LIMITS[action] + 10);
    await expect(assertWithinSpendLimit(action, "venue_1")).rejects.toThrow(SpendLimitError);
  });

  it("lets the first call of the hour through", async () => {
    used(0);
    await expect(assertWithinSpendLimit("generate", "venue_1")).resolves.toBeUndefined();
  });

  it("carries the action on the error, for the message", async () => {
    used(HOURLY_LIMITS.audit);
    await expect(assertWithinSpendLimit("audit", "venue_1")).rejects.toMatchObject({
      action: "audit",
      name: "SpendLimitError",
    });
  });

  // Deliberately the opposite of the entitlement gate. Entitlement decides
  // whether someone may act at all, so an unproven answer refuses. This only
  // decides whether someone already entitled has gone too fast.
  it("fails open when the count query throws", async () => {
    mockWhere.mockRejectedValueOnce(new Error("connection refused"));
    await expect(assertWithinSpendLimit("generate", "venue_1")).resolves.toBeUndefined();
  });

  it("survives a query that returns no row", async () => {
    mockWhere.mockResolvedValueOnce([]);
    await expect(assertWithinSpendLimit("generate", "venue_1")).resolves.toBeUndefined();
  });
});

describe("the ceilings themselves", () => {
  it("sits above the whole catalogue, so a real afternoon is never refused", () => {
    // Nineteen items in the starting set.
    expect(HOURLY_LIMITS.generate).toBeGreaterThan(19);
  });

  it("allows re-auditing, so audit sits above ingest", () => {
    expect(HOURLY_LIMITS.audit).toBeGreaterThan(HOURLY_LIMITS.ingest);
  });

  it("uses no em dashes in the message", async () => {
    used(HOURLY_LIMITS.ingest);
    const error = await assertWithinSpendLimit("ingest", "venue_1").catch((e) => e);
    expect(error).toBeInstanceOf(SpendLimitError);
    expect((error as Error).message).not.toMatch(/—/);
  });
});
