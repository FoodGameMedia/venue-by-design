import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generateProcedurePdf } from "@/lib/systems/procedure-pdf";
import type { ExportableProcedure } from "@/lib/systems/procedure-text";

const PROCEDURE: ExportableProcedure = {
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
  title: "A procedure with nothing filled in",
  domain: null,
  theDefault: null,
  cue: null,
  routine: [],
  reinforcement: null,
  ownerRole: null,
  reviewCadence: null,
  breakpoint: null,
};

describe("generateProcedurePdf", () => {
  it("produces a valid PDF", async () => {
    const bytes = await generateProcedurePdf([PROCEDURE], "The Rose");
    expect(bytes.byteLength).toBeGreaterThan(0);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("puts one procedure on each page, for the wall", async () => {
    const bytes = await generateProcedurePdf([PROCEDURE, BARE, PROCEDURE], "The Rose");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(3);
  });

  it("uses A4 pages", async () => {
    const bytes = await generateProcedurePdf([PROCEDURE], "The Rose");
    const doc = await PDFDocument.load(bytes);
    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(595);
    expect(Math.round(height)).toBe(842);
  });

  it("survives a procedure with every field missing", async () => {
    const bytes = await generateProcedurePdf([BARE], "The Rose");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("survives very long text without throwing", async () => {
    const long: ExportableProcedure = {
      ...PROCEDURE,
      routine: Array.from({ length: 30 }, (_, i) => `Step ${i + 1}. ${"word ".repeat(40)}`),
    };
    const bytes = await generateProcedurePdf([long], "The Rose");
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it("returns a one page document when nothing is selected", async () => {
    const bytes = await generateProcedurePdf([], "The Rose");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });
});
