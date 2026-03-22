import { createAdminClient } from "@/lib/supabase/admin";
import { sendPrescriptionEmail } from "@/lib/email";
import { captureException } from "@/lib/sentry";
import { NextResponse } from "next/server";

/**
 * GET /api/cron/send-prescriptions
 *
 * Triggered every Tuesday morning via external cron (e.g. Netlify scheduled function, Vercel cron).
 * Sends unsent prescription emails to operators.
 * Protected by CRON_SECRET header.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch prescriptions that haven't been emailed yet and aren't retry placeholders
  const { data: prescriptions, error } = await admin
    .from("prescriptions")
    .select(`
      id,
      calm_index,
      primary_domain,
      primary_problem,
      interventions,
      week_focus,
      watch_signal,
      venue_id,
      user_id
    `)
    .is("email_sent_at", null)
    .not("primary_problem", "like", "RETRY_NEEDED:%")
    .order("created_at", { ascending: true })
    .limit(50);

  if (error || !prescriptions) {
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const rx of prescriptions) {
    try {
      // Fetch user email and name
      const { data: user } = await admin
        .from("users")
        .select("email, full_name")
        .eq("id", rx.user_id)
        .single();

      // Fetch venue name
      const { data: venue } = await admin
        .from("venues")
        .select("name")
        .eq("id", rx.venue_id)
        .single();

      if (!user?.email) continue;

      await sendPrescriptionEmail({
        to: user.email,
        operatorName: user.full_name ?? "Operator",
        venueName: venue?.name ?? "Your Venue",
        calmIndex: rx.calm_index,
        primaryDomain: rx.primary_domain,
        primaryProblem: rx.primary_problem,
        interventions: rx.interventions as string[],
        weekFocus: rx.week_focus,
        watchSignal: rx.watch_signal,
      });

      // Mark as sent
      await admin
        .from("prescriptions")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", rx.id);

      sent++;
    } catch (err) {
      failed++;
      captureException(err, {
        context: "send_prescription_email",
        prescriptionId: rx.id,
      });
    }
  }

  return NextResponse.json({ sent, failed, total: prescriptions.length });
}
