/**
 * The print pack: one procedure per page, laminated-card friendly.
 *
 * Usable by any venue on day one with no integration at all, which is why it
 * ships first. Built with pdf-lib and a manual layout, following the pattern in
 * `diagnostic-pdf.ts`.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { DOMAIN_LABELS } from "@/lib/domains";
import type { ExportableProcedure } from "./procedure-text";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK = rgb(0.16, 0.16, 0.16);
const MUTED = rgb(0.45, 0.45, 0.45);
const ACCENT = rgb(0.545, 0.229, 0.322); // plum #8B3A52

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function generateProcedurePdf(
  procedures: readonly ExportableProcedure[],
  venueName: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  if (procedures.length === 0) {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawText("Nothing selected to export.", {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN,
      size: 12,
      font,
      color: INK,
    });
    return doc.save();
  }

  for (const procedure of procedures) {
    const page: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    function draw(
      text: string,
      opts: {
        size?: number;
        font?: PDFFont;
        color?: ReturnType<typeof rgb>;
        gapAfter?: number;
        indent?: number;
      } = {}
    ) {
      const size = opts.size ?? 11;
      const f = opts.font ?? font;
      const indent = opts.indent ?? 0;
      for (const line of wrap(text, f, size, CONTENT_WIDTH - indent)) {
        if (y < MARGIN + size) return;
        page.drawText(line, {
          x: MARGIN + indent,
          y,
          size,
          font: f,
          color: opts.color ?? INK,
        });
        y -= size + 4;
      }
      y -= opts.gapAfter ?? 0;
    }

    // Header
    draw(venueName.toUpperCase(), { size: 8, font: bold, color: MUTED, gapAfter: 6 });
    draw(procedure.title, { size: 20, font: bold, gapAfter: 4 });

    if (procedure.domain) {
      draw(DOMAIN_LABELS[procedure.domain], { size: 9, color: MUTED, gapAfter: 10 });
    } else {
      y -= 10;
    }

    page.drawRectangle({
      x: MARGIN,
      y: y + 6,
      width: CONTENT_WIDTH,
      height: 1.5,
      color: ACCENT,
    });
    y -= 16;

    if (procedure.theDefault) {
      draw("THE DEFAULT", { size: 8, font: bold, color: MUTED, gapAfter: 2 });
      draw(procedure.theDefault, { size: 13, gapAfter: 14 });
    }

    draw("CUE", { size: 8, font: bold, color: MUTED, gapAfter: 2 });
    draw(procedure.cue ?? "Not set", { size: 12, gapAfter: 14 });

    draw("ROUTINE", { size: 8, font: bold, color: MUTED, gapAfter: 4 });
    if (procedure.routine.length === 0) {
      draw("No steps recorded.", { size: 11, color: MUTED, gapAfter: 14 });
    } else {
      procedure.routine.forEach((step, index) => {
        draw(`${index + 1}.  ${step}`, { size: 12, indent: 6, gapAfter: 2 });
      });
      y -= 12;
    }

    if (procedure.reinforcement) {
      draw("WHAT IMPROVES WHEN IT HOLDS", { size: 8, font: bold, color: MUTED, gapAfter: 2 });
      draw(procedure.reinforcement, { size: 11, gapAfter: 14 });
    }

    draw("OWNER", { size: 8, font: bold, color: MUTED, gapAfter: 2 });
    draw(procedure.ownerRole ?? "Not set", { size: 12, gapAfter: 12 });

    draw("REVIEWED", { size: 8, font: bold, color: MUTED, gapAfter: 2 });
    draw(procedure.reviewCadence ?? "Not set", { size: 12, gapAfter: 12 });

    if (procedure.breakpoint) {
      draw("EXISTS BECAUSE", { size: 8, font: bold, color: MUTED, gapAfter: 2 });
      draw(
        `${procedure.breakpoint.description}. Trigger: ${procedure.breakpoint.trigger}.`,
        { size: 10, color: MUTED }
      );
    }

    // Footer. The rostered-off test travels with the card.
    page.drawText(
      "Does it hold on the night its author is rostered off? If it needs you in the building, it is not yet a design.",
      {
        x: MARGIN,
        y: MARGIN - 18,
        size: 7.5,
        font,
        color: MUTED,
      }
    );
  }

  return doc.save();
}
