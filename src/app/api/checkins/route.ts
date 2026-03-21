import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, venues, checkins, domainScores } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CHECKIN_QUESTIONS, calcCalmIndex, type Domain } from "@/lib/checkin-questions";

const DOMAINS = CHECKIN_QUESTIONS.map((q) => q.domain);

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
  const venueId = body.venueId;
  const rawResponses = body.responses;

  if (!venueId || typeof rawResponses !== "object") {
    return NextResponse.json(
      { error: "venueId and responses are required" },
      { status: 400 }
    );
  }

  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, venueId),
  });
  if (!venue || venue.userId !== dbUser.id) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const responses: Record<Domain, number> = {} as Record<Domain, number>;
  for (const d of DOMAINS) {
    const v = rawResponses[d];
    if (typeof v !== "number" || v < 0 || v > 3) {
      return NextResponse.json(
        { error: `Invalid response for domain: ${d}` },
        { status: 400 }
      );
    }
    responses[d] = v;
  }

  const total = Object.values(responses).reduce((a, b) => a + b, 0);
  const calmIndex = calcCalmIndex(total);

  const [inserted] = await db
    .insert(checkins)
    .values({
      venueId,
      userId: dbUser.id,
      responses: responses as unknown as Record<string, unknown>,
      calmIndex,
    })
    .returning();

  if (!inserted) {
    return NextResponse.json({ error: "Failed to save check-in" }, { status: 500 });
  }

  for (const d of DOMAINS) {
    const newScore = responses[d];
    const existing = await db.query.domainScores.findFirst({
      where: and(eq(domainScores.venueId, venueId), eq(domainScores.domain, d)),
    });

    if (existing) {
      const n = existing.checkinCount + 1;
      const prevTotal = existing.score * existing.checkinCount;
      const rollingScore = (prevTotal + newScore) / n;
      await db
        .update(domainScores)
        .set({
          score: Math.round(rollingScore * 100) / 100,
          checkinCount: n,
          updatedAt: new Date(),
        })
        .where(eq(domainScores.id, existing.id));
    } else {
      await db.insert(domainScores).values({
        venueId,
        domain: d,
        score: newScore,
        checkinCount: 1,
      });
    }
  }

  return NextResponse.json({
    id: inserted.id,
    calmIndex,
  });
}
