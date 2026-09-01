import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { captureException } from "@/lib/sentry";
import { chatApiErrorPayload, isAnthropicApiKeyConfigured } from "@/lib/anthropic-models";
import { resolveVenueAccess } from "@/lib/systems/access";
import { CatalogueError } from "@/lib/systems/catalogue-selections";
import {
  generateFromSelection,
  promoteToBreakpoint,
} from "@/lib/systems/catalogue-generate";
import { BreakpointError } from "@/lib/systems/breakpoints";
import { VENUE_TYPES, type VenueType } from "@/lib/systems/venue-types";

async function venueTypeOf(venueId: string): Promise<VenueType | null> {
  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, venueId),
    columns: { venueType: true },
  });
  const type = venue?.venueType;
  return type && (VENUE_TYPES as readonly string[]).includes(type)
    ? (type as VenueType)
    : null;
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

  const venueType = await venueTypeOf(access.actor.venueId);
  const itemId = String(body.itemId ?? "");

  try {
    // Promoting a "not working" tick onto the fragility map needs no model call.
    if (body.action === "promote") {
      const trigger = typeof body.trigger === "string" ? body.trigger : "";
      const existingBreakpointId =
        typeof body.existingBreakpointId === "string" ? body.existingBreakpointId : null;
      const breakpoint = await promoteToBreakpoint(
        access.actor.venueId,
        access.actor.userId,
        venueType,
        itemId,
        trigger,
        existingBreakpointId
      );
      return NextResponse.json({ breakpoint }, { status: 201 });
    }

    if (!isAnthropicApiKeyConfigured()) {
      return NextResponse.json(chatApiErrorPayload(), { status: 503 });
    }

    const answers: Record<string, string> =
      body.answers && typeof body.answers === "object"
        ? Object.fromEntries(
            Object.entries(body.answers as Record<string, unknown>)
              .filter(([, v]) => typeof v === "string")
              .map(([k, v]) => [k, v as string])
          )
        : {};

    const { procedure } = await generateFromSelection({
      venueId: access.actor.venueId,
      userId: access.actor.userId,
      venueName: access.actor.venueName,
      venueType,
      itemId,
      answers,
    });

    return NextResponse.json({ procedure }, { status: 201 });
  } catch (error) {
    if (error instanceof CatalogueError || error instanceof BreakpointError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    captureException(error, { context: "systems_catalogue_generate", itemId });
    return NextResponse.json(chatApiErrorPayload(error), { status: 502 });
  }
}
