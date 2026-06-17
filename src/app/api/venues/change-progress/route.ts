import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, venues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { advanceChangeIndex, getActiveChangeIndex } from "@/lib/venue-progress";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.authId, authUser.id),
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const venueId = typeof body.venueId === "string" ? body.venueId : "";
  const prescriptionKey = typeof body.prescriptionKey === "string" ? body.prescriptionKey : "";
  const held = body.held === true;
  const maxIndex = typeof body.maxIndex === "number" ? Math.max(0, body.maxIndex) : 0;

  if (!venueId || !prescriptionKey) {
    return NextResponse.json(
      { error: "venueId and prescriptionKey are required" },
      { status: 400 }
    );
  }

  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, venueId),
  });
  if (!venue || venue.userId !== dbUser.id) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const currentIndex = getActiveChangeIndex(venue.metadata, prescriptionKey);
  if (!held) {
    return NextResponse.json({ activeIndex: currentIndex });
  }

  const updatedMetadata = advanceChangeIndex(venue.metadata, prescriptionKey, currentIndex, maxIndex);
  const activeIndex = updatedMetadata.changeProgress?.activeIndex ?? currentIndex;

  await db
    .update(venues)
    .set({ metadata: updatedMetadata, updatedAt: new Date() })
    .where(eq(venues.id, venueId));

  return NextResponse.json({ activeIndex });
}
