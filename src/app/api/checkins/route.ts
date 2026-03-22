import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { CHECKIN_QUESTIONS, calcCalmIndex, type Domain } from "@/lib/checkin-questions";
import { generatePrescription } from "@/lib/prescription";
import { captureException } from "@/lib/sentry";

const DOMAINS = CHECKIN_QUESTIONS.map((q) => q.domain);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: dbUsers } = await admin
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .limit(1);
  const dbUser = dbUsers?.[0];
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

  const { data: venue } = await admin
    .from("venues")
    .select("user_id")
    .eq("id", venueId)
    .single();
  if (!venue || venue.user_id !== dbUser.id) {
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

  const { data: inserted, error: insertErr } = await admin
    .from("checkins")
    .insert({
      venue_id: venueId,
      user_id: dbUser.id,
      responses: responses as unknown as Record<string, unknown>,
      calm_index: calmIndex,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json({ error: "Failed to save check-in" }, { status: 500 });
  }

  for (const d of DOMAINS) {
    const newScore = responses[d];
    const { data: existing } = await admin
      .from("domain_scores")
      .select("id, score, checkin_count")
      .eq("venue_id", venueId)
      .eq("domain", d)
      .maybeSingle();

    if (existing) {
      const n = existing.checkin_count + 1;
      const prevTotal = existing.score * existing.checkin_count;
      const rollingScore = Math.round(((prevTotal + newScore) / n) * 100) / 100;
      await admin
        .from("domain_scores")
        .update({ score: rollingScore, checkin_count: n, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await admin.from("domain_scores").insert({
        venue_id: venueId,
        domain: d,
        score: newScore,
        checkin_count: 1,
      });
    }
  }

  // Fire-and-forget: generate AI prescription without blocking the response
  generatePrescriptionSafe(inserted.id, venueId, dbUser.id, responses, calmIndex, admin);

  return NextResponse.json({
    id: inserted.id,
    calmIndex,
  });
}

async function generatePrescriptionSafe(
  checkinId: string,
  venueId: string,
  userId: string,
  responses: Record<Domain, number>,
  calmIndex: number,
  admin: ReturnType<typeof createAdminClient>
) {
  try {
    // Fetch venue context for the prompt
    const { data: venue } = await admin
      .from("venues")
      .select("name, venue_type, staff_count")
      .eq("id", venueId)
      .single();

    const prescription = await generatePrescription({
      responses,
      calmIndex,
      venueName: venue?.name ?? "Unknown Venue",
      venueType: venue?.venue_type ?? "restaurant",
      staffCount: venue?.staff_count ?? null,
    });

    await admin.from("prescriptions").insert({
      checkin_id: checkinId,
      venue_id: venueId,
      user_id: userId,
      calm_index: calmIndex,
      primary_domain: prescription.primaryDomain,
      primary_problem: prescription.primaryProblem,
      interventions: prescription.interventions,
      week_focus: prescription.weekFocus,
      watch_signal: prescription.watchSignal,
      raw_response: prescription as unknown as Record<string, unknown>,
    });
  } catch (error) {
    captureException(error, {
      context: "prescription_generation",
      checkinId,
      venueId,
    });

    // Queue retry by inserting a failed record that can be retried
    try {
      await admin.from("prescriptions").insert({
        checkin_id: checkinId,
        venue_id: venueId,
        user_id: userId,
        calm_index: calmIndex,
        primary_domain: "throughput", // placeholder
        primary_problem: `RETRY_NEEDED: ${error instanceof Error ? error.message : "Unknown error"}`,
        interventions: [],
        week_focus: "Prescription generation failed — will retry",
        watch_signal: "pending",
        raw_response: { error: String(error), retry: true } as unknown as Record<string, unknown>,
      });
    } catch (retryError) {
      captureException(retryError, {
        context: "prescription_retry_queue",
        checkinId,
      });
    }
  }
}
