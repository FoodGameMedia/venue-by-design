import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { captureException } from "@/lib/sentry";
import { resolveVenueAccess } from "@/lib/systems/access";
import {
  CatalogueError,
  setInstallOrder,
  setObligationStatus,
  setSelection,
} from "@/lib/systems/catalogue-selections";
import type { VenueType } from "@/lib/systems/venue-types";
import { VENUE_TYPES } from "@/lib/systems/venue-types";

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

/**
 * One endpoint, three actions, because they are all "the operator answered
 * something on the catalogue screen" and splitting them would mean three
 * round trips for one screen.
 */
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

  try {
    switch (body.action) {
      case "select": {
        const state =
          body.state === "missing" || body.state === "not_working" ? body.state : null;
        const row = await setSelection(
          access.actor.venueId,
          access.actor.userId,
          venueType,
          String(body.itemId ?? ""),
          state
        );
        return NextResponse.json({ selection: row });
      }

      case "obligation": {
        const status = ["have", "missing", "sourced"].includes(body.status)
          ? body.status
          : null;
        if (!status) {
          return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }
        const row = await setObligationStatus(
          access.actor.venueId,
          access.actor.userId,
          venueType,
          String(body.obligationId ?? ""),
          status,
          typeof body.notes === "string" ? body.notes : null
        );
        return NextResponse.json({ obligation: row });
      }

      case "install_order": {
        const ids: string[] = Array.isArray(body.itemIds)
          ? body.itemIds.filter((id: unknown): id is string => typeof id === "string")
          : [];
        await setInstallOrder(access.actor.venueId, ids);
        return NextResponse.json({ ok: true, ordered: ids.length });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof CatalogueError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    captureException(error, { context: "systems_catalogue", action: body.action });
    return NextResponse.json({ error: "Could not save that." }, { status: 500 });
  }
}
