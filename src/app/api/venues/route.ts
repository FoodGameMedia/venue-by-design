import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { captureException } from "@/lib/sentry";

const VALID_VENUE_TYPES = [
  "restaurant",
  "cafe",
  "bar",
  "pub",
  "hotel_fb",
  "large_format",
] as const;

async function ensureDbUser(admin: ReturnType<typeof createAdminClient>, authUser: User) {
  const { data: existingUsers, error: lookupError } = await admin
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .limit(1);

  if (lookupError) throw lookupError;

  const existing = existingUsers?.[0];
  if (existing) return existing;

  const { data: inserted, error: insertError } = await admin
    .from("users")
    .insert({
      auth_id: authUser.id,
      email: authUser.email ?? "",
      full_name: authUser.user_metadata?.full_name ?? null,
      avatar_url: authUser.user_metadata?.avatar_url ?? null,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return inserted;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const dbUser = await ensureDbUser(admin, authUser);
    if (!dbUser) {
      return NextResponse.json({ venues: [] });
    }

    const { data: userVenues, error } = await admin
      .from("venues")
      .select("id, name, venue_type, staff_count, status")
      .eq("user_id", dbUser.id);

    if (error) throw error;

    return NextResponse.json({
      venues: (userVenues ?? []).map((v) => ({
        id: v.id,
        name: v.name,
        venueType: v.venue_type,
        staffCount: v.staff_count,
        status: v.status,
      })),
    });
  } catch (err) {
    captureException(err);
    return NextResponse.json({ error: "Failed to load venues" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const dbUser = await ensureDbUser(admin, authUser);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Venue name is required" }, { status: 400 });
    }

    const venueType = VALID_VENUE_TYPES.includes(body.venueType) ? body.venueType : null;
    const staffCount =
      typeof body.staffCount === "number" && body.staffCount > 0
        ? body.staffCount
        : typeof body.staffCount === "string"
          ? parseInt(body.staffCount, 10)
          : null;
    const safeStaffCount =
      staffCount != null && !Number.isNaN(staffCount) && staffCount > 0 ? staffCount : null;

    const { error } = await admin.from("venues").insert({
      user_id: dbUser.id,
      name,
      venue_type: venueType,
      staff_count: safeStaffCount,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    captureException(err);
    return NextResponse.json({ error: "Failed to save venue" }, { status: 500 });
  }
}
