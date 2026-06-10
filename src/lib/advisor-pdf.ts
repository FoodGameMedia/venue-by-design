import { db } from "@/db";
import { diagnostics, venues } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { generateDiagnosticPdf } from "@/lib/diagnostic-pdf";
import type { DiagnosticReport } from "@/lib/diagnostic-report";

export interface AdvisorReportResult {
  pdfBytes: Uint8Array;
  venueName: string;
  calmIndex: number;
}

/**
 * Generate a white-label (advisor-branded) Deep Diagnostic PDF for a client venue.
 * Uses the venue's most recent stored diagnostic report.
 * Throws if the venue has no completed diagnostic.
 */
export async function generateAdvisorReportPdf(input: {
  venueId: string;
  businessName: string;
}): Promise<AdvisorReportResult> {
  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, input.venueId),
  });
  if (!venue) {
    throw new Error("Venue not found");
  }

  const latestDiagnostic = await db.query.diagnostics.findFirst({
    where: eq(diagnostics.venueId, input.venueId),
    orderBy: [desc(diagnostics.createdAt)],
  });

  if (!latestDiagnostic || !latestDiagnostic.reportRaw) {
    throw new Error("No completed diagnostic available for this venue");
  }

  const report = latestDiagnostic.reportRaw as unknown as DiagnosticReport;
  const calmIndex = latestDiagnostic.calmIndex ?? 0;

  const pdfBytes = await generateDiagnosticPdf(report, venue.name, calmIndex, {
    businessName: input.businessName,
  });

  return { pdfBytes, venueName: venue.name, calmIndex };
}
