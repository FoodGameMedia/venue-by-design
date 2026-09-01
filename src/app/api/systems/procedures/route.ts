import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import { resolveVenueAccess } from "@/lib/systems/access";
import { createProcedure, listProcedures, ProcedureError } from "@/lib/systems/procedures";
import {
  IngestError,
  ingestFiles,
  ingestText,
  type IngestFile,
  type IngestResult,
} from "@/lib/systems/procedure-ingest";

const BUCKET = "procedure-sources";

export async function GET(request: Request) {
  const venueId = new URL(request.url).searchParams.get("venueId");
  const access = await resolveVenueAccess(venueId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const items = await listProcedures(access.actor.venueId);
  return NextResponse.json({ procedures: items });
}

/**
 * Ingest one procedure.
 *
 * Multipart when the operator uploads a document or photographs, JSON when they
 * paste text or describe a shift. The original is stored before extraction runs,
 * so a failed extraction still leaves them something to look at.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  let venueId: unknown;
  let title: string | null = null;
  const files: IngestFile[] = [];
  let pastedBody: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
    }
    venueId = form.get("venueId");
    const rawTitle = form.get("title");
    title = typeof rawTitle === "string" ? rawTitle : null;

    for (const entry of form.getAll("files")) {
      if (entry instanceof File) {
        files.push({
          name: entry.name,
          mimeType: entry.type,
          bytes: new Uint8Array(await entry.arrayBuffer()),
        });
      }
    }
  } else {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    venueId = body.venueId;
    title = typeof body.title === "string" ? body.title : null;
    pastedBody = typeof body.body === "string" ? body.body : null;
  }

  const access = await resolveVenueAccess(venueId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (files.length === 0 && !pastedBody) {
    return NextResponse.json(
      { error: "Upload a procedure or describe how the shift runs." },
      { status: 400 }
    );
  }

  let sourcePath: string | null = null;
  if (files.length > 0) {
    try {
      const admin = createAdminClient();
      const stamp = Date.now();
      const uploaded: string[] = [];
      for (const [index, file] of files.entries()) {
        const path = `${access.actor.userId}/${access.actor.venueId}/${stamp}-${index}-${file.name}`;
        const { error } = await admin.storage
          .from(BUCKET)
          .upload(path, file.bytes, { contentType: file.mimeType, upsert: false });
        if (error) throw error;
        uploaded.push(path);
      }
      sourcePath = uploaded[0] ?? null;
    } catch (error) {
      // Storage is where the original lives, not where the audit reads from, so
      // a failed upload is logged and the ingest continues.
      captureException(error, { context: "systems_source_upload" });
    }
  }

  let ingest: IngestResult;
  try {
    ingest = files.length > 0 ? await ingestFiles(files) : ingestText(pastedBody!);
  } catch (error) {
    if (error instanceof IngestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    captureException(error, { context: "systems_ingest" });
    return NextResponse.json({ error: "Could not read that procedure." }, { status: 502 });
  }

  try {
    const { procedure } = await createProcedure({
      venueId: access.actor.venueId,
      userId: access.actor.userId,
      ingest,
      title,
      sourcePath,
    });
    return NextResponse.json({ procedure }, { status: 201 });
  } catch (error) {
    if (error instanceof ProcedureError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    captureException(error, { context: "systems_procedure_create" });
    return NextResponse.json({ error: "Could not save that procedure." }, { status: 500 });
  }
}
