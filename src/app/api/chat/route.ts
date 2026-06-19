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
import {
  ANTHROPIC_MODELS,
  anthropicErrorDetails,
  chatApiErrorPayload,
  isAnthropicApiKeyConfigured,
} from "@/lib/anthropic-models";
import { captureException } from "@/lib/sentry";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    return await handleChatPost(request);
  } catch (error) {
    captureException(error, { context: "venue_advisor_chat_route" });
    const payload = chatApiErrorPayload(error);
    return NextResponse.json(payload, { status: 500 });
  }
}

async function handleChatPost(request: Request) {
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
  let bookExcerpts: Awaited<ReturnType<typeof retrieveBookChunks>> = [];
  if (lastUserMessage) {
    try {
      bookExcerpts = await retrieveBookChunks(lastUserMessage.content, 6);
    } catch (error) {
      captureException(error, {
        context: "venue_advisor_book_retrieval",
        venueId,
        userId: dbUser.id,
      });
    }
  }

  const systemPrompt = buildSystemPrompt(venueContext, bookExcerpts);

  if (!isAnthropicApiKeyConfigured()) {
    const payload = chatApiErrorPayload();
    captureException(new Error("ANTHROPIC_API_KEY is not configured"), {
      context: "venue_advisor_chat_config",
      venueId,
      userId: dbUser.id,
      code: payload.code,
    });
    return NextResponse.json(payload, { status: 503 });
  }

  try {
    const message = await chatWithAdvisor(validation.messages, systemPrompt);
    return NextResponse.json({ message });
  } catch (error) {
    const payload = chatApiErrorPayload(error);
    captureException(error, {
      context: "venue_advisor_chat",
      venueId,
      userId: dbUser.id,
      code: payload.code,
      model: payload.code === "ANTHROPIC_MODEL_NOT_FOUND" ? ANTHROPIC_MODELS.sonnet : undefined,
      ...anthropicErrorDetails(error),
    });
    return NextResponse.json(payload, {
      status:
        payload.code === "ANTHROPIC_MODEL_NOT_FOUND"
          ? 502
          : payload.code === "ANTHROPIC_AUTH_ERROR"
            ? 502
            : 500,
    });
  }
}
