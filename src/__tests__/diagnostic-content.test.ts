import { describe, it, expect } from "vitest";
import {
  DIAGNOSTIC_QUESTIONS,
  MAX_DIAGNOSTIC_SCORE,
  calcDiagnosticCalmIndex,
} from "@/lib/diagnostic-questions";
import {
  DOMAIN_DEFINITIONS,
  DOMAIN_GROUPS,
  DOMAIN_LABELS,
  DOMAIN_REFERENCE_DETAILS,
  CALM_BANDS,
  getCalmBand,
  getGroupForDomain,
} from "@/lib/domains";
import { DOMAINS } from "@/lib/checkin-questions";

// The exact generic option strings that must no longer appear anywhere.
const RETIRED_TEMPLATE = [
  "The system holds",
  "It strains but recovers",
  "One or two carry it",
  "Something gives way",
  "Not at all — we're struggling",
  "Rarely — regular difficulty",
  "Usually — mostly under control",
  "Consistently — this is a strength",
];

describe("diagnostic question options", () => {
  it("has 40 questions with unchanged domain distribution", () => {
    expect(DIAGNOSTIC_QUESTIONS).toHaveLength(40);
    const counts = DIAGNOSTIC_QUESTIONS.reduce<Record<string, number>>((acc, q) => {
      acc[q.domain] = (acc[q.domain] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      throughput: 6,
      defaults: 6,
      signals: 6,
      pacing: 6,
      endings: 5,
      people_load: 5,
      operational_memory: 6,
    });
  });

  it("gives every question exactly four non-empty options", () => {
    for (const q of DIAGNOSTIC_QUESTIONS) {
      expect(q.options, q.id).toHaveLength(4);
      for (const opt of q.options) {
        expect(typeof opt).toBe("string");
        expect(opt.trim().length, q.id).toBeGreaterThan(0);
      }
    }
  });

  it("uses unique options within each question", () => {
    for (const q of DIAGNOSTIC_QUESTIONS) {
      expect(new Set(q.options).size, q.id).toBe(4);
    }
  });

  it("does not reuse a single template across questions", () => {
    // Each question's option set should be distinct from every other question's.
    const signatures = DIAGNOSTIC_QUESTIONS.map((q) => q.options.join("|"));
    expect(new Set(signatures).size).toBe(DIAGNOSTIC_QUESTIONS.length);

    // And no individual option string should be shared across many questions.
    const allOptions = DIAGNOSTIC_QUESTIONS.flatMap((q) => [...q.options]);
    expect(new Set(allOptions).size).toBe(allOptions.length);
  });

  it("contains none of the retired generic template wording", () => {
    for (const q of DIAGNOSTIC_QUESTIONS) {
      for (const opt of q.options) {
        expect(RETIRED_TEMPLATE, `${q.id}: ${opt}`).not.toContain(opt.trim());
      }
    }
  });

  it("uses no em dashes in questions or options (tone rule)", () => {
    for (const q of DIAGNOSTIC_QUESTIONS) {
      expect(q.question).not.toContain("\u2014");
      for (const opt of q.options) {
        expect(opt).not.toContain("\u2014");
      }
    }
  });

  it("keeps scoring helpers unchanged", () => {
    expect(MAX_DIAGNOSTIC_SCORE).toBe(120);
    expect(calcDiagnosticCalmIndex(0)).toBe(0);
    expect(calcDiagnosticCalmIndex(120)).toBe(10);
    expect(calcDiagnosticCalmIndex(60)).toBe(5);
  });
});

describe("canonical domains", () => {
  it("defines a label and definition for all seven domains", () => {
    for (const d of DOMAINS) {
      expect(DOMAIN_LABELS[d]).toBeTruthy();
      expect(DOMAIN_DEFINITIONS[d].trim().length).toBeGreaterThan(0);
      expect(DOMAIN_REFERENCE_DETAILS[d].trim().length).toBeGreaterThan(50);
    }
  });

  it("groups all seven domains exactly once across three groups", () => {
    const grouped = DOMAIN_GROUPS.flatMap((g) => g.domains);
    expect(DOMAIN_GROUPS).toHaveLength(3);
    expect(grouped).toHaveLength(DOMAINS.length);
    expect(new Set(grouped)).toEqual(new Set(DOMAINS));
  });

  it("maps each domain to its book group", () => {
    expect(getGroupForDomain("throughput").label).toBe("Systems & Flow");
    expect(getGroupForDomain("pacing").label).toBe("Systems & Flow");
    expect(getGroupForDomain("defaults").label).toBe("Systems & Flow");
    expect(getGroupForDomain("people_load").label).toBe("People & Memory");
    expect(getGroupForDomain("signals").label).toBe("People & Memory");
    expect(getGroupForDomain("endings").label).toBe("People & Memory");
    expect(getGroupForDomain("operational_memory").label).toBe("Operational Memory");
  });

  it("maps Calm Index to the right band", () => {
    expect(CALM_BANDS).toHaveLength(3);
    expect(getCalmBand(0).label).toBe("Structural Risk");
    expect(getCalmBand(4).label).toBe("Structural Risk");
    expect(getCalmBand(5).label).toBe("Functional but Fragile");
    expect(getCalmBand(7).label).toBe("Functional but Fragile");
    expect(getCalmBand(8).label).toBe("Designed for Calm");
    expect(getCalmBand(10).label).toBe("Designed for Calm");
  });
});
