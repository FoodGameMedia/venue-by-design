/**
 * Seven domain questions for weekly check-in.
 * One question per behavioural domain from The Food Game.
 * Each scored 0–3.
 */
export const DOMAINS = [
  "throughput",
  "defaults",
  "signals",
  "pacing",
  "endings",
  "people_load",
  "operational_memory",
] as const;

export type Domain = (typeof DOMAINS)[number];

export const CHECKIN_QUESTIONS: { domain: Domain; question: string; description: string }[] = [
  {
    domain: "throughput",
    question: "How well does your team handle flow under pressure during busy service?",
    description: "Flow under pressure, rostering design, capacity",
  },
  {
    domain: "defaults",
    question: "How well do your protocols and defaults handle exceptions without you?",
    description: "Automatic behaviours, protocols, exception handling",
  },
  {
    domain: "signals",
    question: "How clear are your environmental signals to guests and staff?",
    description: "Environmental communication to guests and staff",
  },
  {
    domain: "pacing",
    question: "How disciplined is your pre-service prep and reset between rushes?",
    description: "Temporal load, pre-service prep, reset discipline",
  },
  {
    domain: "endings",
    question: "How strong is your final impression — payment, farewell, peak-end experience?",
    description: "Peak-end rule, payment, farewell, final impression",
  },
  {
    domain: "people_load",
    question: "How sustainable is the emotional and cognitive load on your team?",
    description: "Emotional labour, cognitive load, hero culture",
  },
  {
    domain: "operational_memory",
    question: "How well does your team learn from failure and document improvements?",
    description: "Learning from failure, debrief, documentation",
  },
];

export const SCORE_LABELS = [
  "Not at all — we're struggling",
  "Rarely — regular difficulty",
  "Usually — mostly under control",
  "Consistently — this is a strength",
] as const;

export const MAX_SCORE = 21; // 7 questions × 3 max
export function calcCalmIndex(total: number): number {
  return Math.round((total / MAX_SCORE) * 10 * 10) / 10; // 1 decimal
}
