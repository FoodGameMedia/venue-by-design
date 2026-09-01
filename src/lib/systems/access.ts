/**
 * Session and ownership for every Systems endpoint.
 *
 * Matches the pattern used across the app: the session comes from the Supabase
 * server client, the data comes from Drizzle, and ownership is checked in the
 * route. There is no RLS anywhere in this database, so this check is the only
 * thing standing between one operator and another's procedures. It runs first,
 * every time, with no exceptions.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, venues } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface SystemsActor {
  userId: string;
  venueId: string;
  venueName: string;
}

export type AccessFailure =
  | { ok: false; status: 401; error: "Unauthorized" }
  | { ok: false; status: 404; error: "User not found" | "Venue not found" }
  | { ok: false; status: 400; error: "venueId is required" };

export type AccessResult = { ok: true; actor: SystemsActor } | AccessFailure;

/**
 * Resolve the caller and confirm they own the venue.
 *
 * A venue that exists but belongs to someone else returns 404, not 403, so the
 * endpoint does not confirm the existence of other people's venues.
 */
export async function resolveVenueAccess(venueId: unknown): Promise<AccessResult> {
  if (typeof venueId !== "string" || !venueId.trim()) {
    return { ok: false, status: 400, error: "venueId is required" };
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, authUser.id),
    columns: { id: true },
  });

  if (!dbUser) {
    return { ok: false, status: 404, error: "User not found" };
  }

  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, venueId),
    columns: { id: true, name: true, userId: true },
  });

  if (!venue || venue.userId !== dbUser.id) {
    return { ok: false, status: 404, error: "Venue not found" };
  }

  return {
    ok: true,
    actor: { userId: dbUser.id, venueId: venue.id, venueName: venue.name },
  };
}
