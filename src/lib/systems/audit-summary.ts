/**
 * The one-screen verdict, blunt on purpose.
 *
 * The specification's own example: "you have thirty-four procedures; six are
 * load-bearing; nineteen are dead paving you can retire today; nine should be
 * rewritten as defaults; and three of your worst breakpoints have no procedure
 * at all."
 *
 * That fourth line is why breakpoints exist as records (decision D9).
 */
import type { BreakpointRef } from "./fragility";
import type { ProcedureVerdict } from "./method-questions";

export interface AuditedProcedureRef {
  id: string;
  title: string;
  verdict: ProcedureVerdict;
  breakpointId: string | null;
}

export interface AuditSummary {
  total: number;
  loadBearing: number;
  toRewrite: number;
  deadPaving: number;
  /** Breakpoints no surviving procedure covers. */
  uncoveredBreakpoints: BreakpointRef[];
  /** True when the venue has procedures but has named no breakpoints. */
  hasNoBreakpoints: boolean;
}

/**
 * A breakpoint is covered when at least one procedure linked to it survives the
 * audit. A procedure headed for retirement covers nothing, because it is about
 * to be gone.
 */
export function buildAuditSummary(
  procedures: readonly AuditedProcedureRef[],
  breakpoints: readonly BreakpointRef[]
): AuditSummary {
  const covered = new Set<string>();
  for (const p of procedures) {
    if (p.breakpointId && p.verdict !== "retire") covered.add(p.breakpointId);
  }

  return {
    total: procedures.length,
    loadBearing: procedures.filter((p) => p.verdict === "keep").length,
    toRewrite: procedures.filter((p) => p.verdict === "rewrite").length,
    deadPaving: procedures.filter((p) => p.verdict === "retire").length,
    uncoveredBreakpoints: breakpoints.filter((b) => !covered.has(b.id)),
    hasNoBreakpoints: breakpoints.length === 0,
  };
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * The verdict in plain sentences, in the specification's own register.
 * Returned as lines so the screen can weight them individually.
 */
export function summaryLines(summary: AuditSummary): string[] {
  if (summary.total === 0) {
    return ["Nothing audited yet. Add the procedures you already have and we will tell you which of them are carrying weight."];
  }

  const lines: string[] = [
    `You have ${summary.total} ${plural(summary.total, "procedure", "procedures")}.`,
    `${summary.loadBearing} ${plural(summary.loadBearing, "is", "are")} load-bearing.`,
  ];

  if (summary.deadPaving > 0) {
    lines.push(
      `${summary.deadPaving} ${plural(summary.deadPaving, "is", "are")} dead paving you can retire today.`
    );
  }

  if (summary.toRewrite > 0) {
    lines.push(
      `${summary.toRewrite} should be rewritten as ${plural(summary.toRewrite, "a default", "defaults")}.`
    );
  }

  const uncovered = summary.uncoveredBreakpoints.length;
  if (summary.hasNoBreakpoints) {
    lines.push(
      "You have not named your breakpoints yet, so we cannot tell you what has no procedure at all. That is the next ten minutes well spent."
    );
  } else if (uncovered > 0) {
    lines.push(
      `${uncovered} of your ${plural(uncovered, "breakpoints has", "worst breakpoints have")} no procedure at all.`
    );
  } else {
    lines.push("Every breakpoint you have named is covered by a procedure that survives the audit.");
  }

  return lines;
}
