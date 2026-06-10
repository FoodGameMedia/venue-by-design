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
