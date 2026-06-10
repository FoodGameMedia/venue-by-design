import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { DiagnosticReport } from "./diagnostic-report";

export interface DiagnosticPdfBranding {
  businessName: string;
}

export async function generateDiagnosticPdf(
  report: DiagnosticReport,
  venueName: string,
  calmIndex: number,
  branding?: DiagnosticPdfBranding
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  let y = pageHeight - margin;

  function addPage() {
    const p = doc.addPage([pageWidth, pageHeight]);
    return p;
  }

  const firstPage = addPage();
  let page = firstPage;

  function drawText(text: string, opts: { fontSize?: number; bold?: boolean } = {}) {
    const { fontSize = 11, bold = false } = opts;
    const f = bold ? fontBold : font;
    const lines = wrapText(text, pageWidth - 2 * margin, fontSize, f);
    for (const line of lines) {
      if (y < margin + 20) {
        page = addPage();
        y = pageHeight - margin;
      }
      page.drawText(line, { x: margin, y, size: fontSize, font: f, color: rgb(0.1, 0.1, 0.1) });
      y -= fontSize + 2;
    }
  }

  function drawTitle(title: string, fontSize = 16) {
    if (y < margin + 40) {
      page = addPage();
      y = pageHeight - margin;
    }
    page.drawText(title, {
      x: margin,
      y,
      size: fontSize,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= fontSize + 8;
  }

  if (branding?.businessName) {
    drawText(`Prepared by ${branding.businessName}`, { fontSize: 10, bold: true });
    y -= 6;
  }

  drawTitle("90-Day Design Prescription", 18);
  drawText(venueName, { fontSize: 12 });
  drawText(`Calm Index: ${calmIndex}/10`, { fontSize: 11 });
  y -= 12;

  drawTitle("Executive Summary", 14);
  drawText(report.executive_summary);
  y -= 12;

  drawTitle("Calm Index Interpretation", 14);
  drawText(report.calm_index_interpretation);
  y -= 12;

  drawTitle("Domain Insights", 14);
  for (const d of report.domain_insights) {
    if (y < margin + 60) {
      page = addPage();
      y = pageHeight - margin;
    }
    drawText(`${d.label} (${d.score.toFixed(1)}/3)`, { bold: true });
    if (d.strengths.length) {
      drawText("Strengths: " + d.strengths.join("; "));
    }
    if (d.improvements.length) {
      drawText("Improvements: " + d.improvements.join("; "));
    }
    y -= 8;
  }
  y -= 8;

  drawTitle("90-Day Prescription", 14);
  for (const [month, data] of Object.entries(report.ninety_day_prescription)) {
    if (y < margin + 80) {
      page = addPage();
      y = pageHeight - margin;
    }
    drawText(`${month.replace("_", " ")}: ${data.focus}`, { bold: true });
    for (const a of data.actions) {
      drawText("• " + a);
    }
    y -= 8;
  }
  y -= 8;

  drawTitle("Top 5 Priorities", 14);
  for (const p of report.top_priorities) {
    drawText("• " + p);
  }
  y -= 8;

  drawTitle("Watch Signals", 14);
  for (const s of report.watch_signals) {
    drawText("• " + s);
  }

  return doc.save();
}

function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: { widthOfTextAtSize: (t: string, s: number) => number }
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? current + " " + w : w;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
