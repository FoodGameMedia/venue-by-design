import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@localhost:5432/fake");

const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockInsertReturning = vi.fn();
const mockInsertValues = vi.fn<(...args: unknown[]) => unknown>(() => ({
  returning: mockInsertReturning,
}));
const mockInsert = vi.fn<(...args: unknown[]) => unknown>(() => ({ values: mockInsertValues }));
const mockUpdateReturning = vi.fn();
const mockUpdateWhere = vi.fn<(...args: unknown[]) => unknown>(() => ({
  returning: mockUpdateReturning,
}));
const mockUpdateSet = vi.fn<(...args: unknown[]) => unknown>(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn<(...args: unknown[]) => unknown>(() => ({ set: mockUpdateSet }));

vi.mock("@/db", () => ({
  db: {
    query: {
      breakpoints: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

import {
  BreakpointError,
  MAX_ACTIVE_BREAKPOINTS,
  createBreakpoint,
  listBreakpoints,
  updateBreakpoint,
} from "@/lib/systems/breakpoints";

function row(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    venueId: "venue_1",
    userId: "user_1",
    description: `Breakpoint ${id}`,
    trigger: "The small thing",
    domain: "pacing",
    resolvedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockInsert.mockReturnValue({ values: mockInsertValues });
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
  mockUpdate.mockReturnValue({ set: mockUpdateSet });
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
});

describe("listBreakpoints", () => {
  it("maps rows to the shape the audit needs", async () => {
    mockFindMany.mockResolvedValueOnce([row("bp-1"), row("bp-2", { domain: null })]);
    const result = await listBreakpoints("venue_1");

    expect(result).toEqual([
      { id: "bp-1", description: "Breakpoint bp-1", trigger: "The small thing", domain: "pacing" },
      { id: "bp-2", description: "Breakpoint bp-2", trigger: "The small thing", domain: null },
    ]);
  });
});

describe("createBreakpoint", () => {
  it("stores a trimmed breakpoint", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockInsertReturning.mockResolvedValueOnce([row("bp-1")]);

    await createBreakpoint("venue_1", "user_1", {
      description: "  The Friday changeover falls apart  ",
      trigger: "  No briefing  ",
      domain: "operational_memory",
    });

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "The Friday changeover falls apart",
        trigger: "No briefing",
        domain: "operational_memory",
      })
    );
  });

  it("drops a domain that is not one of the seven", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockInsertReturning.mockResolvedValueOnce([row("bp-1")]);

    await createBreakpoint("venue_1", "user_1", {
      description: "Something breaks",
      trigger: "Something starts it",
      domain: "vibes",
    });

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ domain: null })
    );
  });

  it("requires a description and a trigger", async () => {
    mockFindMany.mockResolvedValue([]);
    await expect(
      createBreakpoint("venue_1", "user_1", { description: "  ", trigger: "x" })
    ).rejects.toThrow(/The breakpoint is required/);
    await expect(
      createBreakpoint("venue_1", "user_1", { description: "x", trigger: "" })
    ).rejects.toThrow(/The trigger is required/);
  });

  it("holds the map to five open breakpoints", async () => {
    mockFindMany.mockResolvedValueOnce(
      Array.from({ length: MAX_ACTIVE_BREAKPOINTS }, (_, i) => ({
        id: `bp-${i}`,
        description: "x",
        trigger: "y",
        domain: null,
      }))
    );

    await expect(
      createBreakpoint("venue_1", "user_1", { description: "One more", trigger: "Again" })
    ).rejects.toThrow(BreakpointError);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("counts only open breakpoints toward the ceiling", async () => {
    mockFindMany.mockResolvedValueOnce([{ id: "bp-1", description: "x", trigger: "y", domain: null }]);
    mockInsertReturning.mockResolvedValueOnce([row("bp-2")]);

    await expect(
      createBreakpoint("venue_1", "user_1", { description: "Two", trigger: "Trigger" })
    ).resolves.toBeDefined();
  });
});

describe("updateBreakpoint", () => {
  it("refuses a breakpoint belonging to another venue", async () => {
    mockFindFirst.mockResolvedValueOnce(undefined);
    await expect(
      updateBreakpoint("bp-1", "venue_2", { description: "Mine now" })
    ).rejects.toThrow(/not found/);
  });

  it("stamps resolvedAt when resolved", async () => {
    mockFindFirst.mockResolvedValueOnce(row("bp-1"));
    mockUpdateReturning.mockResolvedValueOnce([row("bp-1", { resolvedAt: new Date() })]);

    await updateBreakpoint("bp-1", "venue_1", { resolved: true });

    const values = mockUpdateSet.mock.calls[0][0] as { resolvedAt: Date | null };
    expect(values.resolvedAt).toBeInstanceOf(Date);
  });

  it("clears resolvedAt when reopened", async () => {
    mockFindFirst.mockResolvedValueOnce(row("bp-1", { resolvedAt: new Date() }));
    mockUpdateReturning.mockResolvedValueOnce([row("bp-1")]);

    await updateBreakpoint("bp-1", "venue_1", { resolved: false });

    const values = mockUpdateSet.mock.calls[0][0] as { resolvedAt: Date | null };
    expect(values.resolvedAt).toBeNull();
  });

  it("leaves untouched fields out of the update", async () => {
    mockFindFirst.mockResolvedValueOnce(row("bp-1"));
    mockUpdateReturning.mockResolvedValueOnce([row("bp-1")]);

    await updateBreakpoint("bp-1", "venue_1", { trigger: "A new trigger" });

    const values = mockUpdateSet.mock.calls[0][0] as Record<string, unknown>;
    expect(values.trigger).toBe("A new trigger");
    expect(values).not.toHaveProperty("description");
    expect(values).not.toHaveProperty("resolvedAt");
  });
});
