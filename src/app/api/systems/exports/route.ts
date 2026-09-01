import { NextResponse } from "next/server";
import { db } from "@/db";
import { procedureExports } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import { resolveVenueAccess } from "@/lib/systems/access";
import { loadProceduresForExport } from "@/lib/systems/procedures";
import { generateProcedurePdf } from "@/lib/systems/procedure-pdf";
import {
  EXPORT_TARGETS,
  formatExportPack,
  type ExportTarget,
} from "@/lib/systems/procedure-text";

const BUCKET = "procedure-exports";
const SIGNED_URL_SECONDS = 60 * 10;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const access = await resolveVenueAccess(body.venueId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const format = body.format === "pdf" ? "pdf" : "text";
  const target: ExportTarget = EXPORT_TARGETS.includes(body.target) ? body.target : "generic";

  const ids: string[] = Array.isArray(body.procedureIds)
    ? body.procedureIds.filter((id: unknown): id is string => typeof id === "string")
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "Select at least one procedure." }, { status: 400 });
  }

  const items = await loadProceduresForExport(access.actor.venueId, ids);
  if (items.length === 0) {
    return NextResponse.json({ error: "Select at least one procedure." }, { status: 404 });
  }

  try {
    if (format === "text") {
      const text = formatExportPack(items, target);

      await db.insert(procedureExports).values({
        venueId: access.actor.venueId,
        userId: access.actor.userId,
        format: "text",
        procedureIds: ids,
        target,
      });

      return NextResponse.json({ format, target, count: items.length, text });
    }

    const pdfBytes = await generateProcedurePdf(items, access.actor.venueName);
    const path = `${access.actor.userId}/${access.actor.venueId}/${Date.now()}.pdf`;

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: false });

    if (uploadError) throw uploadError;

    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_SECONDS);

    if (signError || !signed?.signedUrl) {
      throw signError ?? new Error("Could not sign the export URL");
    }

    await db.insert(procedureExports).values({
      venueId: access.actor.venueId,
      userId: access.actor.userId,
      format: "pdf",
      procedureIds: ids,
      storagePath: path,
      target,
    });

    return NextResponse.json({
      format,
      target,
      count: items.length,
      url: signed.signedUrl,
    });
  } catch (error) {
    captureException(error, { context: "systems_export", format });
    return NextResponse.json({ error: "Could not build that export." }, { status: 500 });
  }
}
