import { describe, it, expect } from "vitest";

import { generateDiagnosticPdf } from "@/lib/diagnostic-pdf";
import type { DiagnosticReport } from "@/lib/diagnostic-report";

const SAMPLE_REPORT: DiagnosticReport = {
  executive_summary:
    "Your venue shows strong foundations in throughput and pacing, with opportunities in defaults and operational memory.",
  calm_index_interpretation: "A 6.5/10 indicates solid operations with clear improvement areas.",
  domain_insights: [
    {
      domain: "throughput",
      label: "Throughput",
      score: 2.2,
      strengths: ["Good prep", "Clear choke points"],
      improvements: ["Rostering", "Surge handling"],
    },
    {
      domain: "defaults",
      label: "Defaults",
      score: 1.5,
      strengths: [],
      improvements: ["Exception handling", "Documentation"],
    },
  ],
  ninety_day_prescription: {
    month_one: { focus: "Defaults", actions: ["Document protocols", "Train staff"] },
    month_two: { focus: "Signals", actions: ["Improve handover"] },
    month_three: { focus: "Endings", actions: ["Peak-end focus"] },
  },
  top_priorities: ["Document protocols", "Improve rostering", "Debrief routine"],
  watch_signals: ["Staff feedback", "Peak service times"],
};

describe("generateDiagnosticPdf", () => {
  it("returns a non-empty PDF buffer", async () => {
    const pdf = await generateDiagnosticPdf(SAMPLE_REPORT, "Test Venue", 6.5);
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(500);
  });

  it("produces valid PDF header", async () => {
    const pdf = await generateDiagnosticPdf(SAMPLE_REPORT, "Venue Name", 7);
    const header = new TextDecoder().decode(pdf.slice(0, 8));
    expect(header).toMatch(/^%PDF-/);
  });
});
