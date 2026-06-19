import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { Domain } from "@/lib/checkin-questions";
import { retrieveBookChunks } from "@/lib/book-retrieval";
import {
  buildSystemPrompt,
  chatWithAdvisor,
  checkRateLimit,
  validateChatMessages,
  type VenueContext,
} from "@/lib/venue-advisor-chat";
import { captureException } from "@/lib/sentry";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validateChatMessages(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const venueId =
    body && typeof body === "object" && typeof (body as { venueId?: unknown }).venueId === "string"
      ? (body as { venueId: string }).venueId
      : undefined;

  if (!venueId) {
    return NextResponse.json({ error: "venueId is required" }, { status: 400 });
  }

  const rateCheck = checkRateLimit(dbUser.id);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: rateCheck.error }, { status: 429 });
  }

  const { data: venue } = await admin
    .from("venues")
    .select("id, name, venue_type, staff_count, user_id")
    .eq("id", venueId)
    .single();

  if (!venue || venue.user_id !== dbUser.id) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const [{ data: domainScoreRows }, { data: latestCheckin }, { data: latestPrescription }] =
    await Promise.all([
      admin.from("domain_scores").select("domain, score").eq("venue_id", venueId),
      admin
        .from("checkins")
        .select("calm_index, responses, created_at")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("prescriptions")
        .select(
          "primary_domain, primary_problem, week_focus, watch_signal, interventions, created_at"
        )
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const domainScores: Partial<Record<Domain, number>> = {};
  for (const row of domainScoreRows ?? []) {
    if (row.domain && typeof row.score === "number") {
      domainScores[row.domain as Domain] = row.score;
    }
  }

  const venueContext: VenueContext = {
    venueId: venue.id,
    venueName: venue.name,
    venueType: venue.venue_type,
    staffCount: venue.staff_count,
    domainScores: Object.keys(domainScores).length ? domainScores : null,
    latestCheckin: latestCheckin
      ? {
          calmIndex: latestCheckin.calm_index,
          responses: (latestCheckin.responses ?? {}) as Partial<Record<Domain, number>>,
          createdAt: latestCheckin.created_at,
        }
      : null,
    latestPrescription: latestPrescription
      ? {
          primaryDomain: latestPrescription.primary_domain,
          primaryProblem: latestPrescription.primary_problem,
          weekFocus: latestPrescription.week_focus,
          watchSignal: latestPrescription.watch_signal,
          interventions: Array.isArray(latestPrescription.interventions)
            ? (latestPrescription.interventions as string[])
            : [],
          createdAt: latestPrescription.created_at,
        }
      : null,
  };

  const lastUserMessage = [...validation.messages].reverse().find((m) => m.role === "user");
  const bookExcerpts = lastUserMessage
    ? await retrieveBookChunks(lastUserMessage.content, 6)
    : [];

  const systemPrompt = buildSystemPrompt(venueContext, bookExcerpts);

  try {
    const message = await chatWithAdvisor(validation.messages, systemPrompt);
    return NextResponse.json({ message });
  } catch (error) {
    captureException(error, { context: "venue_advisor_chat", venueId, userId: dbUser.id });
    return NextResponse.json(
      { error: "Unable to generate a response right now. Please try again." },
      { status: 500 }
    );
  }
}
