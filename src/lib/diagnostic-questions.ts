/**
 * 40 questions for Deep Diagnostic, grouped by the seven behavioural domains.
 * Each scored 0–3 (0 = struggling, 3 = strength).
 */
import type { Domain } from "./checkin-questions";

export const DOMAINS = [
  "throughput",
  "defaults",
  "signals",
  "pacing",
  "endings",
  "people_load",
  "operational_memory",
] as const satisfies readonly Domain[];

export type DiagnosticDomain = (typeof DOMAINS)[number];

export interface DiagnosticQuestion {
  id: string;
  domain: DiagnosticDomain;
  question: string;
  description?: string;
}

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  // Throughput (6)
  { id: "t1", domain: "throughput", question: "How predictable is your capacity during peak service?" },
  { id: "t2", domain: "throughput", question: "How effective is your rostering at matching demand?" },
  { id: "t3", domain: "throughput", question: "How well does your team handle surges without you?" },
  { id: "t4", domain: "throughput", question: "How clear are your choke points and bottlenecks?" },
  { id: "t5", domain: "throughput", question: "How often does your front-of-house and back-of-house stay in sync?" },
  { id: "t6", domain: "throughput", question: "How reliable is your prep and mise for busy periods?" },
  // Defaults (6)
  { id: "d1", domain: "defaults", question: "How often do your protocols handle exceptions without escalation?" },
  { id: "d2", domain: "defaults", question: "How clear are your default behaviours for common situations?" },
  { id: "d3", domain: "defaults", question: "How well does your team follow established routines?" },
  { id: "d4", domain: "defaults", question: "How documented are your exception-handling procedures?" },
  { id: "d5", domain: "defaults", question: "How automatic are your opening and closing routines?" },
  { id: "d6", domain: "defaults", question: "How consistent are decisions when you're not there?" },
  // Signals (6)
  { id: "s1", domain: "signals", question: "How clear are your environmental cues to guests about flow?" },
  { id: "s2", domain: "signals", question: "How well does your space communicate expectations to staff?" },
  { id: "s3", domain: "signals", question: "How effective are your handover signals between shifts?" },
  { id: "s4", domain: "signals", question: "How visible is critical information when it's needed?" },
  { id: "s5", domain: "signals", question: "How well does your layout reduce the need to ask?" },
  { id: "s6", domain: "signals", question: "How consistent are your visual and verbal cues?" },
  // Pacing (6)
  { id: "p1", domain: "pacing", question: "How disciplined is your pre-service prep?" },
  { id: "p2", domain: "pacing", question: "How well do you reset between rushes?" },
  { id: "p3", domain: "pacing", question: "How predictable is your temporal load across the week?" },
  { id: "p4", domain: "pacing", question: "How often does your team hit the right rhythm?" },
  { id: "p5", domain: "pacing", question: "How sustainable is the pace you expect from staff?" },
  { id: "p6", domain: "pacing", question: "How well do you protect recovery time between busy periods?" },
  // Endings (5)
  { id: "e1", domain: "endings", question: "How strong is your final impression on guests?" },
  { id: "e2", domain: "endings", question: "How smooth is your payment and farewell flow?" },
  { id: "e3", domain: "endings", question: "How well do you apply the peak-end rule in practice?" },
  { id: "e4", domain: "endings", question: "How often do guests leave on a high note?" },
  { id: "e5", domain: "endings", question: "How consistent is your close-out and handover?" },
  // People Load (5)
  { id: "pl1", domain: "people_load", question: "How sustainable is the emotional labour on your team?" },
  { id: "pl2", domain: "people_load", question: "How well distributed is the cognitive load?" },
  { id: "pl3", domain: "people_load", question: "How often does hero culture create burnout risk?" },
  { id: "pl4", domain: "people_load", question: "How well do you support staff under pressure?" },
  { id: "pl5", domain: "people_load", question: "How clear are boundaries around availability and after-hours?" },
  // Operational Memory (6)
  { id: "om1", domain: "operational_memory", question: "How well does your team learn from failure?" },
  { id: "om2", domain: "operational_memory", question: "How regular and effective are your debriefs?" },
  { id: "om3", domain: "operational_memory", question: "How documented are improvements and learnings?" },
  { id: "om4", domain: "operational_memory", question: "How often do the same issues recur?" },
  { id: "om5", domain: "operational_memory", question: "How accessible is institutional knowledge to new staff?" },
  { id: "om6", domain: "operational_memory", question: "How well do you capture and act on feedback?" },
];

export const SCORE_LABELS = [
  "Not at all — we're struggling",
  "Rarely — regular difficulty",
  "Usually — mostly under control",
  "Consistently — this is a strength",
] as const;

export const MAX_DIAGNOSTIC_SCORE = 120; // 40 questions × 3 max

export function calcDiagnosticCalmIndex(total: number): number {
  return Math.round((total / MAX_DIAGNOSTIC_SCORE) * 10 * 10) / 10;
}

export function getQuestionsByDomain(): Map<DiagnosticDomain, DiagnosticQuestion[]> {
  const map = new Map<DiagnosticDomain, DiagnosticQuestion[]>();
  for (const q of DIAGNOSTIC_QUESTIONS) {
    const list = map.get(q.domain) ?? [];
    list.push(q);
    map.set(q.domain, list);
  }
  return map;
}
