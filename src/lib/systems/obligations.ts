/**
 * Outside our remit.
 *
 * The SOPs a venue needs that the method has nothing to say about. The module
 * lists the heading, asks whether one exists, and where it does not, names the
 * body that sets the standard.
 *
 * It never drafts the policy. Payroll, employment and safety carry legal
 * exposure and drafting them is a lawyer's or an accountant's job. The wording
 * is always "here is the authority", never "here is your policy".
 *
 * These sit outside the audit. They never receive a verdict and never count
 * toward the minimum system set, because the three method questions do not
 * apply to a superannuation policy.
 */
import { VENUE_TYPES, type VenueType } from "./venue-types";

export interface Obligation {
  id: string;
  heading: string;
  /** The body that sets the standard. We point, we do not author. */
  authority: string;
  /** Which venue types this applies to. */
  appliesTo: readonly VenueType[];
}

const ALL = VENUE_TYPES;
const LICENSED: readonly VenueType[] = [
  "bar",
  "pub",
  "restaurant",
  "hotel_fb",
  "large_format",
  "other",
];
const GAMING: readonly VenueType[] = ["pub", "large_format", "other"];

export const OBLIGATIONS: readonly Obligation[] = [
  {
    id: "pay_rates",
    heading: "Pay rates, penalties and overtime",
    authority: "Fair Work Ombudsman, and the Award that applies to your venue",
    appliesTo: ALL,
  },
  {
    id: "employment_contracts",
    heading: "Employment contracts and onboarding",
    authority: "Fair Work Ombudsman",
    appliesTo: ALL,
  },
  {
    id: "leave_and_termination",
    heading: "Leave, absence and termination",
    authority: "Fair Work Ombudsman",
    appliesTo: ALL,
  },
  {
    id: "superannuation",
    heading: "Superannuation",
    authority: "Australian Taxation Office",
    appliesTo: ALL,
  },
  {
    id: "whs",
    heading: "Work health and safety",
    authority: "Safe Work Australia and your state regulator",
    appliesTo: ALL,
  },
  {
    id: "workers_comp",
    heading: "Workers compensation and injury management",
    authority: "Your state workers compensation insurer",
    appliesTo: ALL,
  },
  {
    id: "food_safety",
    heading: "Food safety program and allergen control",
    authority: "FSANZ, and your local council or state health department",
    appliesTo: ALL,
  },
  {
    id: "fire_and_evacuation",
    heading: "Fire, emergency and evacuation",
    authority: "Your state regulator and the building's fire order",
    appliesTo: ALL,
  },
  {
    id: "first_aid",
    heading: "First aid",
    authority: "Safe Work Australia code of practice",
    appliesTo: ALL,
  },
  {
    id: "cash_and_security",
    heading: "Cash handling and security",
    authority: "Your insurer's requirements and the state regulator",
    appliesTo: ALL,
  },
  {
    id: "card_payments",
    heading: "Card payment handling",
    authority: "PCI DSS, via your payment provider",
    appliesTo: ALL,
  },
  {
    id: "privacy",
    heading: "Privacy and customer data",
    authority: "Office of the Australian Information Commissioner",
    appliesTo: ALL,
  },
  {
    id: "insurance",
    heading: "Insurance and renewals",
    authority: "Your broker",
    appliesTo: ALL,
  },
  {
    id: "tax_and_bas",
    heading: "Tax, BAS and record keeping",
    authority: "Australian Taxation Office",
    appliesTo: ALL,
  },
  {
    id: "waste",
    heading: "Waste, recycling and grease trap",
    authority: "Your local council and the water authority",
    appliesTo: ALL,
  },
  {
    id: "liquor",
    heading: "Liquor licensing and responsible service",
    authority: "Your state liquor authority",
    appliesTo: LICENSED,
  },
  {
    id: "gaming",
    heading: "Gaming",
    authority: "Your state gaming regulator",
    appliesTo: GAMING,
  },
] as const;

/**
 * Unset and "other" are not the same answer.
 *
 * Unset means we have not asked yet, so we show only what applies to every
 * venue and prompt for the type. Showing gaming to what might be a cafe is
 * noise, and noise is what makes an operator stop reading.
 *
 * "Other" means they told us and none of our six fit. A caterer, a club or a
 * food truck could carry liquor or gaming, so we show everything and let them
 * decide rather than hiding something they need.
 */
export function obligationsFor(venueType: VenueType | null): Obligation[] {
  if (venueType === "other") return [...OBLIGATIONS];
  if (!venueType) return OBLIGATIONS.filter((o) => o.appliesTo.length === ALL.length);
  return OBLIGATIONS.filter((o) => o.appliesTo.includes(venueType));
}

export function getObligation(id: string): Obligation | undefined {
  return OBLIGATIONS.find((o) => o.id === id);
}

/**
 * The line the module shows against an obligation with no procedure. It points
 * at the authority and stops there.
 */
export function obligationPrompt(obligation: Obligation): string {
  return `You have told us there is no procedure covering this. It sits outside what Venue by Design audits, so we will not write it. The standard is set by ${obligation.authority}.`;
}
