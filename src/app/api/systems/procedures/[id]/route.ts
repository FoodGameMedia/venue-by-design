import { NextResponse } from "next/server";
import { captureException } from "@/lib/sentry";
import { resolveVenueAccess } from "@/lib/systems/access";
import { ProcedureError, updateProcedure } from "@/lib/systems/procedures";

export async function PATCH(
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

  try {
    const procedure = await updateProcedure(id, access.actor.venueId, {
      title: body.title,
      status: body.status,
      verdictOverride: body.verdict,
    });
    return NextResponse.json({ procedure });
  } catch (error) {
    if (error instanceof ProcedureError) {
      const status = error.message === "Procedure not found." ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    captureException(error, { context: "systems_procedure_update", procedureId: id });
    return NextResponse.json({ error: "Could not update that procedure." }, { status: 500 });
  }
}
