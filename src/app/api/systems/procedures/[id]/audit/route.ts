import { NextResponse } from "next/server";
import { captureException } from "@/lib/sentry";
import { chatApiErrorPayload, isAnthropicApiKeyConfigured } from "@/lib/anthropic-models";
import { resolveVenueAccess } from "@/lib/systems/access";
import { ProcedureError, runProcedureAudit } from "@/lib/systems/procedures";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const access = await resolveVenueAccess(body.venueId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (!isAnthropicApiKeyConfigured()) {
    return NextResponse.json(chatApiErrorPayload(), { status: 503 });
  }

  try {
    const { audit } = await runProcedureAudit(
      id,
      access.actor.venueId,
      access.actor.venueName
    );
    return NextResponse.json({ audit });
  } catch (error) {
    if (error instanceof ProcedureError) {
      const status = error.message === "Procedure not found." ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    captureException(error, { context: "systems_procedure_audit", procedureId: id });
    return NextResponse.json(chatApiErrorPayload(error), { status: 502 });
  }
}
