import { describe, expect, it } from "vitest";
import {
  METHOD_QUESTIONS,
  METHOD_QUESTION_IDS,
  VERDICT_DESCRIPTIONS,
  VERDICT_LABELS,
  verdictFor,
  type MethodQuestionResult,
} from "@/lib/systems/method-questions";

/**
 * The three questions are the product. This file exists so the wording cannot
 * drift without someone deliberately changing the test.
 */
const CANONICAL = [
  "Is this a desire path, something people actually do when the room is full, or decorative paving that exists only to be shown?",
  "Does it map to a real breakpoint, a moment the venue reliably breaks, or to a domain currently under pressure on the Calm Index?",
  "Does it install a default, or merely issue a rule that a tired person has to remember and enforce?",
];

function results(
  desirePath: boolean,
  realBreakpoint: boolean,
  installsDefault: boolean
): MethodQuestionResult[] {
  return [
    { id: "desire_path", pass: desirePath, rationale: "because" },
    { id: "real_breakpoint", pass: realBreakpoint, rationale: "because" },
    { id: "installs_default", pass: installsDefault, rationale: "because" },
  ];
}

describe("method questions", () => {
  it("carries exactly three questions, numbered 1 to 3", () => {
    expect(METHOD_QUESTIONS).toHaveLength(3);
    expect(METHOD_QUESTIONS.map((q) => q.number)).toEqual([1, 2, 3]);
  });

  it("matches the specification wording verbatim", () => {
    expect(METHOD_QUESTIONS.map((q) => q.question)).toEqual(CANONICAL);
  });

  it("keeps ids and question order in step", () => {
    expect(METHOD_QUESTIONS.map((q) => q.id)).toEqual([...METHOD_QUESTION_IDS]);
  });

  it("gives every question a pass and a fail description", () => {
    for (const q of METHOD_QUESTIONS) {
      expect(q.pass.length).toBeGreaterThan(0);
      expect(q.fail.length).toBeGreaterThan(0);
    }
  });

  it("uses no em dashes anywhere in the copy", () => {
    const copy = [
      ...METHOD_QUESTIONS.flatMap((q) => [q.question, q.pass, q.fail]),
      ...Object.values(VERDICT_LABELS),
      ...Object.values(VERDICT_DESCRIPTIONS),
    ].join(" ");
    expect(copy).not.toMatch(/—/);
  });
});

describe("verdictFor", () => {
  it("keeps a procedure that passes all three", () => {
    expect(verdictFor(results(true, true, true))).toBe("keep");
  });

  it("rewrites when only the default question fails", () => {
    expect(verdictFor(results(true, true, false))).toBe("rewrite");
  });

  it("retires decorative paving even when it would install a default", () => {
    expect(verdictFor(results(false, true, true))).toBe("retire");
  });

  it("retires a procedure that maps to no breakpoint", () => {
    expect(verdictFor(results(true, false, true))).toBe("retire");
  });

  it("prefers retire over rewrite when both apply", () => {
    expect(verdictFor(results(false, true, false))).toBe("retire");
    expect(verdictFor(results(true, false, false))).toBe("retire");
    expect(verdictFor(results(false, false, false))).toBe("retire");
  });

  it("throws when a question result is missing", () => {
    const partial = results(true, true, true).slice(0, 2);
    expect(() => verdictFor(partial)).toThrow(/installs_default/);
  });

  it("labels every verdict", () => {
    for (const verdict of ["keep", "rewrite", "retire"] as const) {
      expect(VERDICT_LABELS[verdict].length).toBeGreaterThan(0);
      expect(VERDICT_DESCRIPTIONS[verdict].length).toBeGreaterThan(0);
    }
  });
});
