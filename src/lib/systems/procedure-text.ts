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

export const EXPORT_TARGETS = ["generic", "jolt", "trail", "xenia", "restoke"] as const;

export type ExportTarget = (typeof EXPORT_TARGETS)[number];

export const EXPORT_TARGET_LABELS: Record<ExportTarget, string> = {
  generic: "Generic checklist",
  jolt: "Jolt",
  trail: "Trail",
  xenia: "Xenia",
  restoke: "Restoke",
};

/** The field names each tool uses, so the paste lands somewhere recognisable. */
const TARGET_FIELDS: Record<ExportTarget, { trigger: string; assignee: string; recurrence: string; items: string; notes: string }> = {
  generic: {
    trigger: "Trigger",
    assignee: "Assignee",
    recurrence: "Recurrence",
    items: "Checklist items",
    notes: "Notes",
  },
  jolt: {
    trigger: "Schedule",
    assignee: "Assigned to",
    recurrence: "Repeats",
    items: "List items",
    notes: "Instructions",
  },
  trail: {
    trigger: "When",
    assignee: "Owner",
    recurrence: "Repeats",
    items: "Steps",
    notes: "Guidance",
  },
  xenia: {
    trigger: "Trigger",
    assignee: "Assignee",
    recurrence: "Recurrence",
    items: "Tasks",
    notes: "Description",
  },
  restoke: {
    trigger: "When",
    assignee: "Responsible",
    recurrence: "Frequency",
    items: "Steps",
    notes: "Notes",
  },
};

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
    "Paste each block into a separate checklist. Validation status is not included: whether a procedure held on a shift its author was rostered off stays in Venue by Design.",
  ].join("\n");

  const blocks = procedures.map((p) => formatProcedureText(p, target));

  return [header, ...blocks].join("\n\n" + "-".repeat(48) + "\n\n");
}
