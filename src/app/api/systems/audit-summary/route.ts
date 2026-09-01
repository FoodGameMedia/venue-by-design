import { NextResponse } from "next/server";
import { resolveVenueAccess } from "@/lib/systems/access";
import { getAuditSummary } from "@/lib/systems/procedures";

export async function GET(request: Request) {
  const venueId = new URL(request.url).searchParams.get("venueId");
  const access = await resolveVenueAccess(venueId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const result = await getAuditSummary(access.actor.venueId);
  return NextResponse.json(result);
}
