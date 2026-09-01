import { describe, expect, it } from "vitest";
import {
  buildAuditSummary,
  summaryLines,
  type AuditedProcedureRef,
} from "@/lib/systems/audit-summary";
import type { BreakpointRef } from "@/lib/systems/fragility";

const BREAKPOINTS: BreakpointRef[] = [
  { id: "bp-1", description: "Friday changeover", trigger: "No briefing", domain: "operational_memory" },
  { id: "bp-2", description: "Lunch deliveries", trigger: "No window", domain: "pacing" },
  { id: "bp-3", description: "Section three falls behind", trigger: "Uneven split", domain: "throughput" },
];

function proc(
  id: string,
  verdict: AuditedProcedureRef["verdict"],
  breakpointId: string | null = null
): AuditedProcedureRef {
  return { id, title: `Procedure ${id}`, verdict, breakpointId };
}

describe("buildAuditSummary", () => {
  it("counts each verdict", () => {
    const summary = buildAuditSummary(
      [proc("a", "keep"), proc("b", "keep"), proc("c", "rewrite"), proc("d", "retire")],
      []
    );

    expect(summary.total).toBe(4);
    expect(summary.loadBearing).toBe(2);
    expect(summary.toRewrite).toBe(1);
    expect(summary.deadPaving).toBe(1);
  });

  it("treats a breakpoint as covered by a kept or rewritten procedure", () => {
    const summary = buildAuditSummary(
      [proc("a", "keep", "bp-1"), proc("b", "rewrite", "bp-2")],
      BREAKPOINTS
    );
    expect(summary.uncoveredBreakpoints.map((b) => b.id)).toEqual(["bp-3"]);
  });

  it("does not let a retiring procedure cover a breakpoint", () => {
    const summary = buildAuditSummary([proc("a", "retire", "bp-1")], BREAKPOINTS);
    expect(summary.uncoveredBreakpoints).toHaveLength(3);
  });

  it("reports every breakpoint uncovered when nothing is linked", () => {
    const summary = buildAuditSummary([proc("a", "keep")], BREAKPOINTS);
    expect(summary.uncoveredBreakpoints).toHaveLength(3);
  });

  it("flags a venue that has named no breakpoints", () => {
    const summary = buildAuditSummary([proc("a", "keep")], []);
    expect(summary.hasNoBreakpoints).toBe(true);
    expect(summary.uncoveredBreakpoints).toEqual([]);
  });
});

describe("summaryLines", () => {
  it("reads like the specification's example", () => {
    const procedures: AuditedProcedureRef[] = [
      ...Array.from({ length: 6 }, (_, i) => proc(`k${i}`, "keep", "bp-1")),
      ...Array.from({ length: 19 }, (_, i) => proc(`r${i}`, "retire")),
      ...Array.from({ length: 9 }, (_, i) => proc(`w${i}`, "rewrite")),
    ];
    const lines = summaryLines(buildAuditSummary(procedures, BREAKPOINTS));

    expect(lines[0]).toBe("You have 34 procedures.");
    expect(lines[1]).toBe("6 are load-bearing.");
    expect(lines[2]).toBe("19 are dead paving you can retire today.");
    expect(lines[3]).toBe("9 should be rewritten as defaults.");
    expect(lines[4]).toBe("2 of your worst breakpoints have no procedure at all.");
  });

  it("uses the singular where it should", () => {
    const lines = summaryLines(
      buildAuditSummary([proc("a", "keep", "bp-1")], [BREAKPOINTS[0], BREAKPOINTS[1]])
    );
    expect(lines[0]).toBe("You have 1 procedure.");
    expect(lines[1]).toBe("1 is load-bearing.");
    expect(lines.at(-1)).toBe("1 of your breakpoints has no procedure at all.");
  });

  it("says so when every named breakpoint is covered", () => {
    const summary = buildAuditSummary(
      [proc("a", "keep", "bp-1"), proc("b", "keep", "bp-2"), proc("c", "keep", "bp-3")],
      BREAKPOINTS
    );
    expect(summaryLines(summary).at(-1)).toContain("Every breakpoint you have named is covered");
  });

  it("pushes the operator to name breakpoints when there are none", () => {
    const lines = summaryLines(buildAuditSummary([proc("a", "keep")], []));
    expect(lines.at(-1)).toContain("not named your breakpoints yet");
  });

  it("handles an empty audit", () => {
    const lines = summaryLines(buildAuditSummary([], []));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Nothing audited yet");
  });

  it("uses no em dashes", () => {
    const lines = summaryLines(
      buildAuditSummary([proc("a", "keep", "bp-1"), proc("b", "retire")], BREAKPOINTS)
    );
    expect(lines.join(" ")).not.toMatch(/—/);
  });
});
