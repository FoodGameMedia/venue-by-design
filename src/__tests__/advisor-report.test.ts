import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DiagnosticReport } from "@/lib/diagnostic-report";

vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@localhost:5432/fake");

const mockVenuesFindFirst = vi.fn();
const mockDiagnosticsFindFirst = vi.fn();

vi.mock("@/db", () => ({
  db: {
    query: {
      venues: { findFirst: (...args: unknown[]) => mockVenuesFindFirst(...args) },
      diagnostics: { findFirst: (...args: unknown[]) => mockDiagnosticsFindFirst(...args) },
    },
  },
}));

import { generateAdvisorReportPdf } from "@/lib/advisor-pdf";

const SAMPLE_REPORT: DiagnosticReport = {
  executive_summary: "Strong foundations with clear improvement areas.",
  calm_index_interpretation: "A 6.5/10 indicates solid operations.",
  domain_insights: [
    {
      domain: "throughput",
      label: "Throughput",
      score: 2.2,
      strengths: ["Good prep"],
      improvements: ["Rostering"],
    },
  ],
  ninety_day_prescription: {
    month_one: { focus: "Defaults", actions: ["Document protocols"] },
    month_two: { focus: "Signals", actions: ["Improve handover"] },
    month_three: { focus: "Endings", actions: ["Peak-end focus"] },
  },
  top_priorities: ["Document protocols", "Improve rostering"],
  watch_signals: ["Staff feedback"],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateAdvisorReportPdf", () => {
  it("generates a branded PDF from the venue's latest diagnostic", async () => {
    mockVenuesFindFirst.mockResolvedValueOnce({ id: "venue_1", name: "The Local Kitchen" });
    mockDiagnosticsFindFirst.mockResolvedValueOnce({
      id: "diag_1",
      venueId: "venue_1",
      calmIndex: 6.5,
      reportRaw: SAMPLE_REPORT,
    });

    const result = await generateAdvisorReportPdf({
      venueId: "venue_1",
      businessName: "Acme Advisory",
    });

    expect(result.venueName).toBe("The Local Kitchen");
    expect(result.calmIndex).toBe(6.5);
    expect(result.pdfBytes).toBeInstanceOf(Uint8Array);
    expect(result.pdfBytes.length).toBeGreaterThan(500);

    const header = new TextDecoder().decode(result.pdfBytes.slice(0, 8));
    expect(header).toMatch(/^%PDF-/);
  });

  it("throws when the venue does not exist", async () => {
    mockVenuesFindFirst.mockResolvedValueOnce(undefined);

    await expect(
      generateAdvisorReportPdf({ venueId: "missing", businessName: "Acme" })
    ).rejects.toThrow("Venue not found");
  });

  it("throws when the venue has no completed diagnostic", async () => {
    mockVenuesFindFirst.mockResolvedValueOnce({ id: "venue_1", name: "Venue" });
    mockDiagnosticsFindFirst.mockResolvedValueOnce(undefined);

    await expect(
      generateAdvisorReportPdf({ venueId: "venue_1", businessName: "Acme" })
    ).rejects.toThrow("No completed diagnostic available for this venue");
  });

  it("throws when the latest diagnostic has no report", async () => {
    mockVenuesFindFirst.mockResolvedValueOnce({ id: "venue_1", name: "Venue" });
    mockDiagnosticsFindFirst.mockResolvedValueOnce({
      id: "diag_1",
      venueId: "venue_1",
      calmIndex: 5,
      reportRaw: null,
    });

    await expect(
      generateAdvisorReportPdf({ venueId: "venue_1", businessName: "Acme" })
    ).rejects.toThrow("No completed diagnostic available for this venue");
  });
});
