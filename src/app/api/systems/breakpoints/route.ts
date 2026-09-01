import { NextResponse } from "next/server";
import { captureException } from "@/lib/sentry";
import { resolveVenueAccess } from "@/lib/systems/access";
import {
  BreakpointError,
  createBreakpoint,
  listAllBreakpoints,
  updateBreakpoint,
} from "@/lib/systems/breakpoints";

export async function GET(request: Request) {
  const venueId = new URL(request.url).searchParams.get("venueId");
  const access = await resolveVenueAccess(venueId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const rows = await listAllBreakpoints(access.actor.venueId);
  return NextResponse.json({ breakpoints: rows });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const access = await resolveVenueAccess(body.venueId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const breakpoint = await createBreakpoint(access.actor.venueId, access.actor.userId, {
      description: body.description,
      trigger: body.trigger,
      domain: body.domain,
    });
    return NextResponse.json({ breakpoint }, { status: 201 });
  } catch (error) {
    if (error instanceof BreakpointError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    captureException(error, { context: "systems_breakpoint_create" });
    return NextResponse.json({ error: "Could not save that breakpoint." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const access = await resolveVenueAccess(body.venueId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const breakpoint = await updateBreakpoint(body.id, access.actor.venueId, {
      description: body.description,
      trigger: body.trigger,
      domain: body.domain,
      resolved: body.resolved,
    });
    return NextResponse.json({ breakpoint });
  } catch (error) {
    if (error instanceof BreakpointError) {
      const status = error.message === "Breakpoint not found." ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    captureException(error, { context: "systems_breakpoint_update" });
    return NextResponse.json({ error: "Could not update that breakpoint." }, { status: 500 });
  }
}
