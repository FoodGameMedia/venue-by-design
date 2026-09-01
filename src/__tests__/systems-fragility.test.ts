import { describe, expect, it } from "vitest";
import {
  buildFragilityProfile,
  fragilityHeadline,
  formatFragilityProfile,
  type BreakpointRef,
  type DomainScoreRef,
} from "@/lib/systems/fragility";
import type { DiagnosticQuestion } from "@/lib/diagnostic-questions";

const BREAKPOINTS: BreakpointRef[] = [
  {
    id: "bp-1",
    description: "The Friday changeover falls apart",
    trigger: "Day team leaves before the night team is briefed",
    domain: "operational_memory",
  },
  {
    id: "bp-2",
    description: "Deliveries land in the middle of the lunch rush",
    trigger: "No agreed delivery window",
    domain: "pacing",
  },
];

const SCORES: DomainScoreRef[] = [
  { domain: "throughput", score: 2.4 },
  { domain: "pacing", score: 0.8 },
  { domain: "endings", score: 2.9 },
  { domain: "operational_memory", score: 1.1 },
];

const QUESTIONS = [
  { id: "p1", domain: "pacing", question: "How protected is your prep window?", options: ["a", "b", "c", "d"] },
  { id: "p2", domain: "pacing", question: "How clean is your reset between sittings?", options: ["a", "b", "c", "d"] },
  { id: "e1", domain: "endings", question: "How strong is the bill moment?", options: ["a", "b", "c", "d"] },
] as unknown as DiagnosticQuestion[];

describe("buildFragilityProfile", () => {
  it("sorts domain scores weakest first and names the two weakest", () => {
    const profile = buildFragilityProfile({
      breakpoints: BREAKPOINTS,
      domainScores: SCORES,
      calmIndex: 5.2,
    });

    expect(profile.domainScores.map((d) => d.domain)).toEqual([
      "pacing",
      "operational_memory",
      "throughput",
      "endings",
    ]);
    expect(profile.weakestDomains).toEqual(["pacing", "operational_memory"]);
  });

  it("resolves the Calm Index band", () => {
    const profile = buildFragilityProfile({
      breakpoints: [],
      domainScores: [],
      calmIndex: 5.2,
    });
    expect(profile.band?.id).toBe("functional_fragile");
  });

  it("leaves the band null when the venue has never checked in", () => {
    const profile = buildFragilityProfile({
      breakpoints: [],
      domainScores: [],
      calmIndex: null,
    });
    expect(profile.band).toBeNull();
    expect(profile.isEmpty).toBe(true);
  });

  it("breaks ties on domain name so repeat audits do not wobble", () => {
    const tied: DomainScoreRef[] = [
      { domain: "signals", score: 1 },
      { domain: "defaults", score: 1 },
      { domain: "pacing", score: 3 },
    ];
    const first = buildFragilityProfile({ breakpoints: [], domainScores: tied, calmIndex: 4 });
    const second = buildFragilityProfile({
      breakpoints: [],
      domainScores: [...tied].reverse(),
      calmIndex: 4,
    });
    expect(first.weakestDomains).toEqual(second.weakestDomains);
    expect(first.weakestDomains).toEqual(["defaults", "signals"]);
  });

  it("collects only diagnostic answers scored failing or fragile", () => {
    const profile = buildFragilityProfile({
      breakpoints: [],
      domainScores: [],
      calmIndex: 4,
      diagnosticResponses: { p1: 0, p2: 1, e1: 3 },
      diagnosticQuestions: QUESTIONS,
    });

    expect(profile.strugglingAnswers.map((a) => a.score)).toEqual([0, 1]);
    expect(profile.strugglingAnswers.every((a) => a.domain === "pacing")).toBe(true);
  });

  it("handles a venue with breakpoints but no scores at all", () => {
    const profile = buildFragilityProfile({
      breakpoints: BREAKPOINTS,
      domainScores: [],
      calmIndex: null,
    });
    expect(profile.isEmpty).toBe(false);
    expect(profile.weakestDomains).toEqual([]);
  });

  it("returns fewer than two weakest domains when only one score exists", () => {
    const profile = buildFragilityProfile({
      breakpoints: [],
      domainScores: [{ domain: "signals", score: 1.5 }],
      calmIndex: 6,
    });
    expect(profile.weakestDomains).toEqual(["signals"]);
  });
});

describe("formatFragilityProfile", () => {
  it("names the breakpoints with their ids so the audit can link one", () => {
    const profile = buildFragilityProfile({
      breakpoints: BREAKPOINTS,
      domainScores: SCORES,
      calmIndex: 5.2,
    });
    const text = formatFragilityProfile(profile);

    expect(text).toContain("bp-1");
    expect(text).toContain("The Friday changeover falls apart");
    expect(text).toContain("Under most pressure: Pacing and Operational Memory.");
  });

  it("says plainly when there is nothing to judge against", () => {
    const profile = buildFragilityProfile({
      breakpoints: [],
      domainScores: [],
      calmIndex: null,
    });
    expect(formatFragilityProfile(profile)).toContain("No fragility data yet");
  });

  it("records that no breakpoints are named when scores exist without them", () => {
    const profile = buildFragilityProfile({
      breakpoints: [],
      domainScores: SCORES,
      calmIndex: 5.2,
    });
    expect(formatFragilityProfile(profile)).toContain("Named breakpoints: none recorded yet.");
  });
});

describe("fragilityHeadline", () => {
  it("names the two weakest domains and counts the breakpoints", () => {
    const profile = buildFragilityProfile({
      breakpoints: BREAKPOINTS,
      domainScores: SCORES,
      calmIndex: 5.2,
    });
    expect(fragilityHeadline(profile)).toBe(
      "Under most pressure: Pacing and Operational Memory. You have named 2 breakpoints."
    );
  });

  it("uses the singular for one breakpoint", () => {
    const profile = buildFragilityProfile({
      breakpoints: [BREAKPOINTS[0]],
      domainScores: SCORES,
      calmIndex: 5.2,
    });
    expect(fragilityHeadline(profile)).toContain("You have named 1 breakpoint.");
  });

  it("says so when there are no scores", () => {
    const profile = buildFragilityProfile({
      breakpoints: [],
      domainScores: [],
      calmIndex: null,
    });
    expect(fragilityHeadline(profile)).toContain("No domain scores yet");
  });
});
