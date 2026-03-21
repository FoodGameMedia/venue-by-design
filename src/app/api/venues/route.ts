import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, venues } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let dbUser = await db.query.users.findFirst({
    where: eq(users.authId, authUser.id),
  });
  if (!dbUser) {
    const [inserted] = await db
      .insert(users)
      .values({
        authId: authUser.id,
        email: authUser.email ?? "",
        fullName: authUser.user_metadata?.full_name ?? null,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
      })
      .returning();
    dbUser = inserted;
  }
  if (!dbUser) {
    return NextResponse.json({ venues: [] });
  }

  const userVenues = await db.query.venues.findMany({
    where: eq(venues.userId, dbUser.id),
  });

  return NextResponse.json({
    venues: userVenues.map((v) => ({
      id: v.id,
      name: v.name,
      venueType: v.venueType,
      staffCount: v.staffCount,
      status: v.status,
    })),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let dbUser = await db.query.users.findFirst({
    where: eq(users.authId, authUser.id),
  });
  if (!dbUser) {
    const [inserted] = await db
      .insert(users)
      .values({
        authId: authUser.id,
        email: authUser.email ?? "",
        fullName: authUser.user_metadata?.full_name ?? null,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
      })
      .returning();
    dbUser = inserted;
  }
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Venue name is required" }, { status: 400 });
  }

  const validTypes = ["restaurant", "cafe", "bar", "pub", "hotel_fb", "large_format"] as const;
  const venueType = validTypes.includes(body.venueType) ? body.venueType : null;
  const staffCount =
    typeof body.staffCount === "number" && body.staffCount > 0
      ? body.staffCount
      : typeof body.staffCount === "string"
        ? parseInt(body.staffCount, 10)
        : null;
  const safeStaffCount =
    staffCount != null && !Number.isNaN(staffCount) && staffCount > 0 ? staffCount : null;

  await db.insert(venues).values({
    userId: dbUser.id,
    name,
    venueType,
    staffCount: safeStaffCount,
  });

  return NextResponse.json({ ok: true });
}
