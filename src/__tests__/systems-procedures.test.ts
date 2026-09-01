import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@localhost:5432/fake");

// vi.mock is hoisted above module scope, so anything its factory dereferences
// eagerly must be hoisted too.
const q = vi.hoisted(() => ({
  procedures: { findFirst: vi.fn(), findMany: vi.fn() },
  procedureVersions: { findFirst: vi.fn() },
  procedureAudits: { findMany: vi.fn() },
  breakpoints: { findMany: vi.fn() },
  domainScores: { findMany: vi.fn() },
  checkins: { findFirst: vi.fn() },
  diagnostics: { findFirst: vi.fn() },
}));

const insertReturning = vi.fn();
const insertValues = vi.fn<(...args: unknown[]) => unknown>(() => ({
  returning: insertReturning,
}));
const insert = vi.fn<(...args: unknown[]) => unknown>(() => ({ values: insertValues }));
const updateWhere = vi.fn<(...args: unknown[]) => unknown>(() => undefined);
const updateSet = vi.fn<(...args: unknown[]) => unknown>(() => ({ where: updateWhere }));
const update = vi.fn<(...args: unknown[]) => unknown>(() => ({ set: updateSet }));

vi.mock("@/db", () => ({
  db: {
    query: q,
    insert: (...args: unknown[]) => insert(...args),
    update: (...args: unknown[]) => update(...args),
  },
}));

const mockAudit = vi.fn();
vi.mock("@/lib/systems/procedure-audit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/systems/procedure-audit")>(
    "@/lib/systems/procedure-audit"
  );
  return { ...actual, auditProcedure: (...args: unknown[]) => mockAudit(...args) };
});

import {
  ProcedureError,
  getAuditSummary,
  loadFragilityProfile,
  runProcedureAudit,
  updateProcedure,
} from "@/lib/systems/procedures";

function auditResult(overrides: Record<string, unknown> = {}) {
  return {
    title: "Run the Friday handover",
    domain: "operational_memory",
    breakpointId: "bp-1",
    questionResults: [
      { id: "desire_path", pass: true, rationale: "a" },
      { id: "real_breakpoint", pass: true, rationale: "b" },
      { id: "installs_default", pass: true, rationale: "c" },
    ],
    verdict: "keep",
    summary: "Carrying weight.",
    rewriteNotes: null,
    fields: {
      theDefault: "Night lead owns the last ten minutes.",
      cue: "Shift change",
      routine: ["Walk the pass"],
      reinforcement: "Nobody starts behind.",
      ownerRole: "Night lead",
      reviewCadence: "Monthly",
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  insert.mockReturnValue({ values: insertValues });
  insertValues.mockReturnValue({ returning: insertReturning });
  update.mockReturnValue({ set: updateSet });
  updateSet.mockReturnValue({ where: updateWhere });
  updateWhere.mockResolvedValue(undefined);

  q.breakpoints.findMany.mockResolvedValue([
    { id: "bp-1", description: "Friday changeover", trigger: "No briefing", domain: "operational_memory", resolvedAt: null },
  ]);
  q.domainScores.findMany.mockResolvedValue([
    { domain: "pacing", score: 0.8 },
    { domain: "operational_memory", score: 1.1 },
  ]);
  q.checkins.findFirst.mockResolvedValue({ calmIndex: 5.2 });
  q.diagnostics.findFirst.mockResolvedValue({ responses: {} });
});

describe("loadFragilityProfile", () => {
  it("assembles breakpoints and derived pressure", async () => {
    const profile = await loadFragilityProfile("venue_1");
    expect(profile.breakpoints).toHaveLength(1);
    expect(profile.weakestDomains).toEqual(["pacing", "operational_memory"]);
    expect(profile.calmIndex).toBe(5.2);
    expect(profile.band?.id).toBe("functional_fragile");
  });

  it("copes with a venue that has never checked in", async () => {
    q.checkins.findFirst.mockResolvedValueOnce(undefined);
    q.diagnostics.findFirst.mockResolvedValueOnce(undefined);
    const profile = await loadFragilityProfile("venue_1");
    expect(profile.calmIndex).toBeNull();
    expect(profile.band).toBeNull();
  });
});

describe("runProcedureAudit", () => {
  beforeEach(() => {
    q.procedures.findFirst.mockResolvedValue({ id: "p1", venueId: "venue_1", title: "Old title" });
    q.procedureVersions.findFirst.mockResolvedValue({ id: "v1", body: "The procedure text." });
    insertReturning.mockResolvedValue([{ id: "audit_1" }]);
  });

  it("records the audit and writes the habit fields back", async () => {
    mockAudit.mockResolvedValueOnce(auditResult());

    const { audit, auditId } = await runProcedureAudit("p1", "venue_1", "The Rose");

    expect(auditId).toBe("audit_1");
    expect(audit.verdict).toBe("keep");

    const audited = insertValues.mock.calls[0][0] as Record<string, unknown>;
    expect(audited.verdict).toBe("keep");
    expect(audited.model).toBe("claude-sonnet-4-6");
    expect(audited.fragilitySnapshot).toMatchObject({
      calmIndex: 5.2,
      weakestDomains: ["pacing", "operational_memory"],
      breakpointIds: ["bp-1"],
    });

    const patched = updateSet.mock.calls[0][0] as Record<string, unknown>;
    expect(patched.title).toBe("Run the Friday handover");
    expect(patched.ownerRole).toBe("Night lead");
    expect(patched.provenance).toBe("audited_keep");
  });

  it("marks a rewrite verdict as audited_rewrite", async () => {
    mockAudit.mockResolvedValueOnce(auditResult({ verdict: "rewrite" }));
    await runProcedureAudit("p1", "venue_1", "The Rose");
    expect((updateSet.mock.calls[0][0] as Record<string, unknown>).provenance).toBe(
      "audited_rewrite"
    );
  });

  it("leaves a retired procedure as imported, not part of the set", async () => {
    mockAudit.mockResolvedValueOnce(auditResult({ verdict: "retire" }));
    await runProcedureAudit("p1", "venue_1", "The Rose");
    expect((updateSet.mock.calls[0][0] as Record<string, unknown>).provenance).toBe("imported");
  });

  it("refuses a procedure from another venue", async () => {
    q.procedures.findFirst.mockResolvedValueOnce(undefined);
    await expect(runProcedureAudit("p1", "venue_2", "Someone Else")).rejects.toThrow(
      /not found/
    );
    expect(mockAudit).not.toHaveBeenCalled();
  });

  it("refuses a procedure with no content", async () => {
    q.procedureVersions.findFirst.mockResolvedValueOnce(undefined);
    await expect(runProcedureAudit("p1", "venue_1", "The Rose")).rejects.toThrow(
      /no content to audit/
    );
  });
});

describe("updateProcedure", () => {
  beforeEach(() => {
    q.procedures.findFirst.mockResolvedValue({ id: "p1", venueId: "venue_1" });
    updateWhere.mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: "p1" }]) });
  });

  it("refuses to shortcut the rostered-off gate", async () => {
    await expect(
      updateProcedure("p1", "venue_1", { status: "installed" })
    ).rejects.toThrow(/rostered off/);
    expect(update).not.toHaveBeenCalled();
  });

  it("allows draft to live", async () => {
    await updateProcedure("p1", "venue_1", { status: "live" });
    expect((updateSet.mock.calls[0][0] as Record<string, unknown>).status).toBe("live");
  });

  it("refuses an empty title", async () => {
    await expect(updateProcedure("p1", "venue_1", { title: "   " })).rejects.toThrow(
      ProcedureError
    );
  });

  it("records an operator verdict override as its own audit row", async () => {
    q.procedureVersions.findFirst.mockResolvedValueOnce({ id: "v1" });
    await updateProcedure("p1", "venue_1", { verdictOverride: "retire" });

    const row = insertValues.mock.calls[0][0] as Record<string, unknown>;
    expect(row.verdict).toBe("retire");
    expect(row.model).toBe("operator");
    expect(row.summary).toContain("operator");
  });

  it("refuses a procedure from another venue", async () => {
    q.procedures.findFirst.mockResolvedValueOnce(undefined);
    await expect(updateProcedure("p1", "venue_2", { title: "Mine" })).rejects.toThrow(
      /not found/
    );
  });
});

describe("getAuditSummary", () => {
  it("counts verdicts and names uncovered breakpoints", async () => {
    q.procedures.findMany.mockResolvedValueOnce([
      { id: "p1", title: "A", domain: null, breakpointId: "bp-1", status: "draft", updatedAt: new Date() },
      { id: "p2", title: "B", domain: null, breakpointId: null, status: "draft", updatedAt: new Date() },
      { id: "p3", title: "C", domain: null, breakpointId: null, status: "draft", updatedAt: new Date() },
    ]);
    q.procedureAudits.findMany.mockResolvedValueOnce([
      { procedureId: "p1", verdict: "keep", summary: "s", createdAt: new Date() },
      { procedureId: "p2", verdict: "retire", summary: "s", createdAt: new Date() },
    ]);
    q.breakpoints.findMany.mockResolvedValueOnce([
      { id: "bp-1", description: "Friday changeover", trigger: "No briefing", domain: null, resolvedAt: null },
      { id: "bp-2", description: "Lunch deliveries", trigger: "No window", domain: null, resolvedAt: null },
    ]);

    const result = await getAuditSummary("venue_1");

    expect(result.summary.total).toBe(2);
    expect(result.summary.loadBearing).toBe(1);
    expect(result.summary.deadPaving).toBe(1);
    expect(result.summary.uncoveredBreakpoints.map((b) => b.id)).toEqual(["bp-2"]);
    expect(result.unaudited).toBe(1);
  });

  it("takes only the most recent audit per procedure", async () => {
    const older = new Date("2026-08-01");
    const newer = new Date("2026-08-20");
    q.procedures.findMany.mockResolvedValueOnce([
      { id: "p1", title: "A", domain: null, breakpointId: null, status: "draft", updatedAt: newer },
    ]);
    q.procedureAudits.findMany.mockResolvedValueOnce([
      { procedureId: "p1", verdict: "retire", summary: "later", createdAt: newer },
      { procedureId: "p1", verdict: "keep", summary: "earlier", createdAt: older },
    ]);
    q.breakpoints.findMany.mockResolvedValueOnce([]);

    const result = await getAuditSummary("venue_1");
    expect(result.summary.deadPaving).toBe(1);
    expect(result.summary.loadBearing).toBe(0);
  });
});
