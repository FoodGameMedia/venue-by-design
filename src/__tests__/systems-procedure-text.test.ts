import { describe, expect, it } from "vitest";
import {
  EXPORT_TARGETS,
  EXPORT_TARGET_LABELS,
  formatExportPack,
  formatProcedureText,
  type ExportableProcedure,
} from "@/lib/systems/procedure-text";

const FULL: ExportableProcedure = {
  title: "Run the Friday handover",
  domain: "operational_memory",
  theDefault: "The night lead owns the last ten minutes of the day shift.",
  cue: "Shift change, 4pm",
  routine: ["Walk the pass", "Read the book", "Name the three risks"],
  reinforcement: "Nobody starts the night already behind.",
  ownerRole: "Night lead",
  reviewCadence: "Monthly",
  breakpoint: {
    description: "The Friday changeover falls apart",
    trigger: "Day team leaves before the night team is briefed",
  },
};

const BARE: ExportableProcedure = {
  title: "Untitled procedure",
  domain: null,
  theDefault: null,
  cue: null,
  routine: [],
  reinforcement: null,
  ownerRole: null,
  reviewCadence: null,
  breakpoint: null,
};

describe("formatProcedureText", () => {
  it("maps the fields the specification names", () => {
    const text = formatProcedureText(FULL, "generic");

    expect(text).toContain("Trigger: Shift change, 4pm");
    expect(text).toContain("Assignee: Night lead");
    expect(text).toContain("Recurrence: Monthly");
    expect(text).toContain("1. Walk the pass");
    expect(text).toContain("3. Name the three risks");
    expect(text).toContain("The default: The night lead owns");
    expect(text).toContain("What improves when it holds: Nobody starts");
  });

  it("never exports validation status", () => {
    for (const target of EXPORT_TARGETS) {
      const text = formatProcedureText(FULL, target).toLowerCase();
      expect(text).not.toContain("rostered off");
      expect(text).not.toContain("installed");
      expect(text).not.toContain("validation");
    }
  });

  it("uses each tool's own field names", () => {
    expect(formatProcedureText(FULL, "jolt")).toContain("Schedule: Shift change, 4pm");
    expect(formatProcedureText(FULL, "jolt")).toContain("Assigned to: Night lead");
    expect(formatProcedureText(FULL, "trail")).toContain("When: Shift change, 4pm");
    expect(formatProcedureText(FULL, "restoke")).toContain("Responsible: Night lead");
    expect(formatProcedureText(FULL, "xenia")).toContain("Assignee: Night lead");
  });

  it("says Not set rather than inventing a value", () => {
    const text = formatProcedureText(BARE, "generic");
    expect(text).toContain("Trigger: Not set");
    expect(text).toContain("Assignee: Not set");
    expect(text).toContain("Recurrence: Not set");
    expect(text).toContain("(No steps recorded)");
  });

  it("omits the notes block entirely when there is nothing to say", () => {
    expect(formatProcedureText(BARE, "generic")).not.toContain("Notes:");
  });

  it("carries the breakpoint it exists for", () => {
    expect(formatProcedureText(FULL, "generic")).toContain(
      "Exists because: The Friday changeover falls apart"
    );
  });

  it("labels every target", () => {
    for (const target of EXPORT_TARGETS) {
      expect(EXPORT_TARGET_LABELS[target].length).toBeGreaterThan(0);
    }
  });
});

describe("formatExportPack", () => {
  it("counts the procedures and separates the blocks", () => {
    const pack = formatExportPack([FULL, BARE], "generic");
    expect(pack).toContain("2 procedures");
    expect(pack).toContain("Run the Friday handover");
    expect(pack).toContain("Untitled procedure");
    expect(pack.split("-".repeat(48))).toHaveLength(3);
  });

  it("uses the singular for one", () => {
    expect(formatExportPack([FULL], "generic")).toContain("1 procedure\n");
  });

  it("names the target in the header", () => {
    expect(formatExportPack([FULL], "restoke")).toContain("Restoke export");
  });

  it("says so plainly when nothing is selected", () => {
    expect(formatExportPack([], "generic")).toBe("Nothing selected to export.");
  });

  it("tells the operator that validation stays behind", () => {
    expect(formatExportPack([FULL], "generic")).toContain("stays in Venue by Design");
  });
});
