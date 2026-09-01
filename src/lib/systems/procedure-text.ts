/**
 * Copy-ready text, formatted for pasting straight into the checklist builders
 * the venue already runs.
 *
 * The module authors, it does not enforce. This is the hand-off. The field
 * mapping is the specification's:
 *
 *   Cue                          -> Trigger or schedule
 *   Routine steps                -> Checklist items
 *   Owner                        -> Assignee
 *   Review cadence               -> Recurrence
 *   The default and reinforcement -> Notes or guidance on the task
 *   Validation status            -> not exported, it lives in Venue by Design
 *
 * That last line is a rule, not an omission. The rostered-off record is the
 * part of the method the enforcement tool has no way to hold.
 */
import { DOMAIN_LABELS } from "@/lib/domains";
import type { Domain } from "@/lib/checkin-questions";

/**
 * Only targets whose field names have been read from the product's own live
 * documentation ship here.
 *
 * Jolt, Trail and Xenia were drafted from search summaries rather than the
 * pages themselves and are deliberately absent. They come back when someone has
 * actually read their help centres. Naming a field wrongly in an export tells
 * the customer we have never seen the product.
 */
export const EXPORT_TARGETS = ["generic", "restoke"] as const;

export type ExportTarget = (typeof EXPORT_TARGETS)[number];

export const EXPORT_TARGET_LABELS: Record<ExportTarget, string> = {
  generic: "Generic checklist",
  restoke: "Restoke",
};

/**
 * The field names each tool actually uses on screen, so the paste lands
 * somewhere recognisable.
 *
 * Verified against each product's live help centre on 2 September 2026, not
 * written from memory. `where` tells the operator which screen to be on and,
 * where the tool has a bulk-paste path, how to use it.
 *
 * If a product renames a field, this table is wrong until someone re-checks it.
 * Re-verify before trusting it in a release.
 */
interface TargetFields {
  trigger: string;
  assignee: string;
  recurrence: string;
  items: string;
  notes: string;
  /** Where to paste, in the tool's own navigation. */
  where: string;
}

const TARGET_FIELDS: Record<ExportTarget, TargetFields> = {
  generic: {
    trigger: "Trigger",
    assignee: "Assignee",
    recurrence: "Recurrence",
    items: "Checklist items",
    notes: "Notes",
    where: "Paste each block into a separate checklist in your tool.",
  },
  restoke: {
    trigger: "Appears in MyDay, day and time, with a cut-off time",
    assignee: "Departments, then delegate to a person from MyDay",
    recurrence: "Schedule days, or Advanced for fortnightly and monthly",
    items: "Instructions",
    notes: "A Free text or Title line, or Embed a document",
    where:
      "Operations, then Procedures, then Blank procedure. Use Create from text and paste the steps: every new line becomes an item.",
  },
};

/**
 * The routine as bare lines, one step each, no numbering.
 *
 * Restoke's Create from text turns every new line into an item, so a numbered
 * list would arrive with the numbers baked into the text of each step.
 */
export function formatStepsForBulkPaste(procedure: ExportableProcedure): string {
  if (procedure.routine.length === 0) return "";
  return procedure.routine.join("\n");
}

/** Targets whose bulk-paste path wants bare lines rather than a numbered list. */
export const BULK_PASTE_TARGETS: readonly ExportTarget[] = ["restoke"];

export interface ExportableProcedure {
  title: string;
  domain: Domain | null;
  theDefault: string | null;
  cue: string | null;
  routine: string[];
  reinforcement: string | null;
  ownerRole: string | null;
  reviewCadence: string | null;
  /** The breakpoint it covers, for the notes block. */
  breakpoint?: { description: string; trigger: string } | null;
}

const NOT_SET = "Not set";

/** One procedure, ready to paste. */
export function formatProcedureText(
  procedure: ExportableProcedure,
  target: ExportTarget = "generic"
): string {
  const f = TARGET_FIELDS[target];
  const lines: string[] = [procedure.title];

  if (procedure.domain) {
    lines.push(`Domain: ${DOMAIN_LABELS[procedure.domain]}`);
  }

  lines.push(
    "",
    `${f.trigger}: ${procedure.cue ?? NOT_SET}`,
    `${f.assignee}: ${procedure.ownerRole ?? NOT_SET}`,
    `${f.recurrence}: ${procedure.reviewCadence ?? NOT_SET}`,
    "",
    `${f.items}:`
  );

  if (procedure.routine.length === 0) {
    lines.push("1. (No steps recorded)");
  } else {
    procedure.routine.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
  }

  const notes: string[] = [];
  if (procedure.theDefault) notes.push(`The default: ${procedure.theDefault}`);
  if (procedure.reinforcement) notes.push(`What improves when it holds: ${procedure.reinforcement}`);
  if (procedure.breakpoint) {
    notes.push(
      `Exists because: ${procedure.breakpoint.description}. Trigger: ${procedure.breakpoint.trigger}.`
    );
  }

  if (notes.length > 0) {
    lines.push("", `${f.notes}:`, ...notes);
  }

  // Bulk-paste tools turn every line into an item, so numbering would come
  // through as text. Give those targets a clean block to paste.
  if (BULK_PASTE_TARGETS.includes(target) && procedure.routine.length > 0) {
    lines.push("", "Steps to paste, one per line:", formatStepsForBulkPaste(procedure));
  }

  return lines.join("\n");
}

/** A whole queue, ready to paste, separated so each block is obvious. */
export function formatExportPack(
  procedures: readonly ExportableProcedure[],
  target: ExportTarget = "generic"
): string {
  if (procedures.length === 0) {
    return "Nothing selected to export.";
  }

  const header = [
    `Venue by Design, ${EXPORT_TARGET_LABELS[target]} export`,
    `${procedures.length} procedure${procedures.length === 1 ? "" : "s"}`,
    "",
    TARGET_FIELDS[target].where,
    "",
    "Validation status is not included: whether a procedure held on a shift its author was rostered off stays in Venue by Design.",
  ].join("\n");

  const blocks = procedures.map((p) => formatProcedureText(p, target));

  return [header, ...blocks].join("\n\n" + "-".repeat(48) + "\n\n");
}
