/**
 * The three method questions every procedure is audited against.
 *
 * Canonical from the Systems Module specification (July 2026), which draws them
 * from The Calm Venue: the minimum system set, desire paths, and defaults over
 * rules. The wording is frozen. Changing it changes the product, so it changes
 * on the decisions record first, never here alone.
 */

/** Stable identifiers. Persisted in `procedure_audits.question_results`. */
export const METHOD_QUESTION_IDS = [
  "desire_path",
  "real_breakpoint",
  "installs_default",
] as const;

export type MethodQuestionId = (typeof METHOD_QUESTION_IDS)[number];

export interface MethodQuestion {
  id: MethodQuestionId;
  /** 1, 2 or 3, as numbered in the specification. */
  number: 1 | 2 | 3;
  /** Verbatim from the specification. Do not reword. */
  question: string;
  /** What a pass looks like, shown beside the result on the verdict screen. */
  pass: string;
  /** What a fail looks like. */
  fail: string;
}

export const METHOD_QUESTIONS: readonly MethodQuestion[] = [
  {
    id: "desire_path",
    number: 1,
    question:
      "Is this a desire path, something people actually do when the room is full, or decorative paving that exists only to be shown?",
    pass: "People actually do this when the room is full.",
    fail: "This exists to be shown, not to be used on the floor.",
  },
  {
    id: "real_breakpoint",
    number: 2,
    question:
      "Does it map to a real breakpoint, a moment the venue reliably breaks, or to a domain currently under pressure on the Calm Index?",
    pass: "It covers a named breakpoint or a domain under pressure.",
    fail: "It covers nothing the venue is currently breaking on.",
  },
  {
    id: "installs_default",
    number: 3,
    question:
      "Does it install a default, or merely issue a rule that a tired person has to remember and enforce?",
    pass: "It installs a decision made once, a rule made clear, or a buffer built in.",
    fail: "It issues a rule someone has to remember and enforce under pressure.",
  },
] as const;

export type ProcedureVerdict = "keep" | "rewrite" | "retire";

export interface MethodQuestionResult {
  id: MethodQuestionId;
  pass: boolean;
  /** One line, in the operator's own terms. Shown on the verdict screen. */
  rationale: string;
}

/**
 * The verdict rule, derived from the specification's own language.
 *
 * Question 1 fails: decorative paving. "A procedure that exists to be shown to
 *   an auditor, and not to be used on the floor, is flagged for retirement."
 * Question 2 fails: it covers nothing the venue breaks on, so it is not
 *   load-bearing and the minimum set is better without it.
 * Questions 1 and 2 pass but 3 fails: the need is real and the form is wrong,
 *   so it is "rewritten as a default".
 * All three pass: load-bearing. Keep.
 *
 * Retirement wins over rewrite: there is no point rewriting a procedure that
 * nobody follows or that fixes nothing.
 */
export function verdictFor(results: readonly MethodQuestionResult[]): ProcedureVerdict {
  const byId = new Map(results.map((r) => [r.id, r.pass]));

  for (const q of METHOD_QUESTIONS) {
    if (!byId.has(q.id)) {
      throw new Error(`Missing result for method question "${q.id}"`);
    }
  }

  if (!byId.get("desire_path")) return "retire";
  if (!byId.get("real_breakpoint")) return "retire";
  if (!byId.get("installs_default")) return "rewrite";
  return "keep";
}

/** Operator-facing labels. Retiring is a win, and the copy says so. */
export const VERDICT_LABELS: Record<ProcedureVerdict, string> = {
  keep: "Load-bearing",
  rewrite: "Rewrite as a default",
  retire: "Dead paving, retire it",
};

export const VERDICT_DESCRIPTIONS: Record<ProcedureVerdict, string> = {
  keep: "This one earns its place. People follow it, it covers something you actually break on, and it installs a default rather than asking someone to remember.",
  rewrite:
    "The need is real but the form is wrong. It asks a tired person to remember and enforce a rule. Rewrite it as a decision made once, a rule made clear, or a buffer built in.",
  retire:
    "Retire it. A shorter set of procedures people trust beats a long one they have learned to ignore, so this is a win, not a gap.",
};
