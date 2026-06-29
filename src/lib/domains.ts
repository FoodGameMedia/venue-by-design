/**
 * Canonical domain reference for The Calm Venue method.
 *
 * One definition string per domain, reused everywhere a definition is shown
 * (inline beneath diagnostic questions, on Domain cards, on the reference view).
 * The three group labels and their membership are canonical from the book and
 * are reused across the diagnostic, the Domains screen, and the report.
 */
import type { Domain } from "./checkin-questions";

export const DOMAIN_LABELS: Record<Domain, string> = {
  throughput: "Throughput",
  defaults: "Defaults",
  signals: "Signals",
  pacing: "Pacing",
  endings: "Endings",
  people_load: "People Load",
  operational_memory: "Operational Memory",
};

/** Canonical, single-source definition per domain. */
export const DOMAIN_DEFINITIONS: Record<Domain, string> = {
  throughput: "Flow under pressure, rostering design, capacity",
  defaults: "Automatic behaviours, protocols, exception handling",
  signals: "Environmental communication to guests and staff",
  pacing: "Temporal load, pre-service prep, reset discipline",
  endings: "Peak-end rule, payment, farewell, final impression",
  people_load: "Emotional labour, cognitive load, hero culture",
  operational_memory: "Learning from failure, debrief, documentation",
};

/** Expanded reference copy for the Domains page reference section. */
export const DOMAIN_REFERENCE_DETAILS: Record<Domain, string> = {
  throughput:
    "Throughput is how work moves through your venue when the room is full and the pass is hot — orders, tables, drinks, and handovers without the whole shift depending on one person sprinting. It covers roster design, station layout, and whether your capacity matches how you actually trade on a Friday night. When throughput is weak, every service feels like a rescue mission; when it holds, the team can breathe and guests feel the difference.",
  defaults:
    "Defaults are the behaviours your venue runs on without anyone having to think — how a table is set, what happens when a dish 86s, how a handover starts, what gets done before doors open. Strong defaults mean the floor and pass know what 'normal' looks like, so exceptions do not become chaos. Calm operations depend on a handful of clear protocols that hold even when the GM or head chef is not in the building.",
  signals:
    "Signals are what your venue communicates without saying a word — menu layout, lighting, music, signage, how staff greet and redirect, what guests see when they walk in. In Australian hospitality, where turnover is high and first impressions matter, weak signals force staff to explain everything verbally and absorb pressure that good design would carry. Clear signals reduce friction for guests and give your team fewer fires to fight on the floor.",
  pacing:
    "Pacing is the rhythm of your week and your service — prep windows, opening routines, reset between sittings, and whether the venue can recover before the next rush hits. A venue with poor pacing trades in a permanent state of catch-up: late prep, rushed briefings, no time to fix what broke last night. Steady pacing is what lets small improvements stick instead of being washed away by the next busy shift.",
  endings:
    "Endings shape what guests remember — the bill moment, the farewell, the last drink, how you handle a complaint at close. Hospitality research shows people weight the peak and the end of an experience heavily; a great meal can still leave a sour taste if payment is awkward or the goodbye feels rushed. Strong endings protect your reputation and stop one rough final ten minutes from undoing an otherwise calm service.",
  people_load:
    "People Load is the invisible weight your team carries — emotional labour on the floor, cognitive load in the pass, the pressure to be the hero who saves every service. Hero culture feels noble in the moment but burns people out and hides system problems behind individual effort. When people load is high, rostering, training, and leadership all need attention; when it eases, your best people stay longer and your systems get a fair test.",
  operational_memory:
    "Operational Memory is how your venue learns — debriefs after a blow-up, notes that survive a staff change, documentation that turns a one-off fix into a lasting standard. Without it, the same Saturday-night failure returns every few weeks because the lesson lived in one person's head. Building operational memory is how calm operations compound over months instead of resetting every time the roster turns over.",
};

export type DomainGroupId = "systems_flow" | "people_memory" | "operational_memory";

export interface DomainGroup {
  id: DomainGroupId;
  label: string;
  domains: Domain[];
}

/** The three groups and their seven domains, canonical from the book. */
export const DOMAIN_GROUPS: DomainGroup[] = [
  { id: "systems_flow", label: "Systems & Flow", domains: ["throughput", "pacing", "defaults"] },
  { id: "people_memory", label: "People & Memory", domains: ["people_load", "signals", "endings"] },
  { id: "operational_memory", label: "Operational Memory", domains: ["operational_memory"] },
];

export function getGroupForDomain(domain: Domain): DomainGroup {
  return DOMAIN_GROUPS.find((g) => g.domains.includes(domain)) ?? DOMAIN_GROUPS[0];
}

/**
 * Calm Index bands. The number is total over max times ten, a 0 to 10 number.
 * A score is not a grade, it is a map.
 */
export interface CalmBand {
  id: "structural_risk" | "functional_fragile" | "designed_for_calm";
  label: string;
  min: number;
  max: number;
}

export const CALM_BANDS: CalmBand[] = [
  { id: "structural_risk", label: "Structural Risk", min: 0, max: 4 },
  { id: "functional_fragile", label: "Functional but Fragile", min: 5, max: 7 },
  { id: "designed_for_calm", label: "Designed for Calm", min: 8, max: 10 },
];

export function getCalmBand(index: number): CalmBand {
  const rounded = Math.round(index);
  return CALM_BANDS.find((b) => rounded >= b.min && rounded <= b.max) ?? CALM_BANDS[0];
}
