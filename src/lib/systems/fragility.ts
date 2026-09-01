/**
 * The fragility profile: the lens the audit looks through.
 *
 * Two sources, per decision D9.
 *  1. Named breakpoints. The operator's fragility map (The Calm Venue ch.05):
 *     the moments the venue reliably breaks, each with the small thing that
 *     starts it. This is the artefact the specification assumes exists.
 *  2. Derived pressure. The two weakest domains, the Calm Index and its band,
 *     and any diagnostic question the operator scored 0 or 1.
 *
 * Pure functions over rows already fetched. No database access here, so the
 * whole module is directly unit testable.
 */
import type { Domain } from "@/lib/checkin-questions";
import { DOMAIN_LABELS, getCalmBand, type CalmBand } from "@/lib/domains";
import type { DiagnosticQuestion } from "@/lib/diagnostic-questions";

/** A row from `breakpoints`, trimmed to what the audit needs. */
export interface BreakpointRef {
  id: string;
  description: string;
  trigger: string;
  domain: Domain | null;
}

/** A row from `domain_scores`. */
export interface DomainScoreRef {
  domain: Domain;
  score: number;
}

export interface StrugglingAnswer {
  domain: Domain;
  question: string;
  score: number;
}

export interface FragilityProfileInput {
  breakpoints: readonly BreakpointRef[];
  domainScores: readonly DomainScoreRef[];
  /** Latest Calm Index, 0 to 10. Null when the venue has never checked in. */
  calmIndex: number | null;
  /** Latest deep diagnostic responses, keyed by question id. Optional. */
  diagnosticResponses?: Record<string, number> | null;
  diagnosticQuestions?: readonly DiagnosticQuestion[];
}

export interface FragilityProfile {
  calmIndex: number | null;
  band: CalmBand | null;
  /** Every domain score, weakest first. */
  domainScores: DomainScoreRef[];
  /** The two weakest domains. Fewer when the venue has fewer scores. */
  weakestDomains: Domain[];
  breakpoints: BreakpointRef[];
  /** Diagnostic questions scored 0 (failing) or 1 (fragile). */
  strugglingAnswers: StrugglingAnswer[];
  /** True when there is nothing to audit against and the audit should say so. */
  isEmpty: boolean;
}

/** How many domains count as "under pressure" for method question 2. */
export const WEAKEST_DOMAIN_COUNT = 2;

/** A diagnostic score at or below this is failing or fragile. */
export const STRUGGLING_SCORE_CEILING = 1;

export function buildFragilityProfile(input: FragilityProfileInput): FragilityProfile {
  const domainScores = [...input.domainScores].sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    // Stable, predictable order when scores tie, so the audit does not wobble
    // between runs on the same data.
    return a.domain.localeCompare(b.domain);
  });

  const weakestDomains = domainScores.slice(0, WEAKEST_DOMAIN_COUNT).map((d) => d.domain);

  const strugglingAnswers: StrugglingAnswer[] = [];
  const responses = input.diagnosticResponses;
  const questions = input.diagnosticQuestions;
  if (responses && questions) {
    for (const q of questions) {
      const score = responses[q.id];
      if (typeof score === "number" && score <= STRUGGLING_SCORE_CEILING) {
        strugglingAnswers.push({ domain: q.domain, question: q.question, score });
      }
    }
  }

  const breakpoints = [...input.breakpoints];

  return {
    calmIndex: input.calmIndex,
    band: input.calmIndex == null ? null : getCalmBand(input.calmIndex),
    domainScores,
    weakestDomains,
    breakpoints,
    strugglingAnswers,
    isEmpty:
      breakpoints.length === 0 && domainScores.length === 0 && strugglingAnswers.length === 0,
  };
}

/**
 * The profile as prompt text for the audit call. Kept here so the wording lives
 * beside the data it describes.
 */
export function formatFragilityProfile(profile: FragilityProfile): string {
  if (profile.isEmpty) {
    return "No fragility data yet. This venue has no named breakpoints, no domain scores and no diagnostic. Judge question 2 on the procedure alone and say plainly that the venue has not told us where it breaks.";
  }

  const lines: string[] = [];

  if (profile.calmIndex != null && profile.band) {
    lines.push(
      `Calm Index: ${profile.calmIndex.toFixed(1)} out of 10 (${profile.band.label}).`
    );
  }

  if (profile.breakpoints.length) {
    lines.push("", "Named breakpoints (the fragility map):");
    for (const b of profile.breakpoints) {
      const domain = b.domain ? ` [${DOMAIN_LABELS[b.domain]}]` : "";
      lines.push(`- ${b.description}${domain}. Trigger: ${b.trigger}. (id: ${b.id})`);
    }
  } else {
    lines.push("", "Named breakpoints: none recorded yet.");
  }

  if (profile.domainScores.length) {
    lines.push("", "Domain scores, weakest first (0 to 3):");
    for (const d of profile.domainScores) {
      lines.push(`- ${DOMAIN_LABELS[d.domain]}: ${d.score.toFixed(2)}`);
    }
    if (profile.weakestDomains.length) {
      const weakest = profile.weakestDomains.map((d) => DOMAIN_LABELS[d]).join(" and ");
      lines.push(`Under most pressure: ${weakest}.`);
    }
  }

  if (profile.strugglingAnswers.length) {
    lines.push("", "Diagnostic answers scored failing or fragile:");
    for (const a of profile.strugglingAnswers) {
      lines.push(`- [${DOMAIN_LABELS[a.domain]}] ${a.question} (scored ${a.score})`);
    }
  }

  return lines.join("\n");
}

/** One plain line for the verdict screen, naming where the venue is weakest. */
export function fragilityHeadline(profile: FragilityProfile): string {
  if (profile.weakestDomains.length === 0) {
    return "No domain scores yet, so there is nothing to weigh this against.";
  }
  const names = profile.weakestDomains.map((d) => DOMAIN_LABELS[d]);
  const weakest = names.length === 1 ? names[0] : `${names[0]} and ${names[1]}`;
  const count = profile.breakpoints.length;
  const mapped =
    count === 0
      ? "You have not named any breakpoints yet."
      : `You have named ${count} breakpoint${count === 1 ? "" : "s"}.`;
  return `Under most pressure: ${weakest}. ${mapped}`;
}
