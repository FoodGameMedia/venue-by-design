import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { hasDiagnosticAccess } from "@/lib/diagnostic-access";
import { DIAGNOSTIC_QUESTIONS, calcDiagnosticCalmIndex } from "@/lib/diagnostic-questions";
import { generateDiagnosticReport } from "@/lib/diagnostic-report";
import { generateDiagnosticPdf } from "@/lib/diagnostic-pdf";
import { db } from "@/db";
import { diagnostics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { captureException } from "@/lib/sentry";

const BUCKET = "diagnostic-reports";

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
    .select("id, email, full_name")
    .eq("auth_id", authUser.id)
    .limit(1);
  const dbUser = dbUsers?.[0];
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const hasAccess = await hasDiagnosticAccess(dbUser.id);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Deep Diagnostic requires purchase. Please complete checkout first." },
      { status: 403 }
    );
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
    .select("id, name, venue_type, staff_count, user_id")
    .eq("id", venueId)
    .single();
  if (!venue || venue.user_id !== dbUser.id) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const responses: Record<string, number> = {};
  for (const q of DIAGNOSTIC_QUESTIONS) {
    const v = rawResponses[q.id];
    if (typeof v !== "number" || v < 0 || v > 3) {
      return NextResponse.json(
        { error: `Invalid response for question ${q.id}` },
        { status: 400 }
      );
    }
    responses[q.id] = v;
  }

  const total = Object.values(responses).reduce((a, b) => a + b, 0);
  const calmIndex = calcDiagnosticCalmIndex(total);

  const [inserted] = await db
    .insert(diagnostics)
    .values({
      venueId,
      userId: dbUser.id,
      responses: responses as Record<string, unknown>,
      calmIndex,
    })
    .returning({ id: diagnostics.id });

  if (!inserted) {
    return NextResponse.json({ error: "Failed to save diagnostic" }, { status: 500 });
  }
  const diagnosticId = inserted.id;

  let report: Awaited<ReturnType<typeof generateDiagnosticReport>>;
  try {
    report = await generateDiagnosticReport({
      responses,
      calmIndex,
      venueName: venue.name,
      venueType: venue.venue_type ?? undefined,
      staffCount: venue.staff_count,
      questions: DIAGNOSTIC_QUESTIONS,
    });

    const pdfBytes = await generateDiagnosticPdf(report, venue.name, calmIndex);

    const path = `${dbUser.id}/${diagnosticId}.pdf`;

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    let reportPdfPath: string | null = path;
    if (uploadError) {
      captureException(uploadError, { context: "diagnostic_pdf_upload", diagnosticId });
      reportPdfPath = null;
    }

    await db
      .update(diagnostics)
      .set({
        reportRaw: report as unknown as Record<string, unknown>,
        reportPdfPath,
      })
      .where(eq(diagnostics.id, diagnosticId));

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data: signedUrl } = reportPdfPath
      ? await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7)
      : { data: null };

    const recipient = process.env.DIAGNOSTIC_REPORT_TO_OVERRIDE || dbUser.email;
    const fromAddress =
      process.env.RESEND_FROM_ADDRESS || "Venue by Design <onboarding@resend.dev>";
    await resend.emails.send({
      from: fromAddress,
      to: recipient,
      subject: `Your 90-Day Design Prescription — ${venue.name}`,
      html: `
        <h1>Your Deep Diagnostic Report</h1>
        <p>Hi ${dbUser.full_name ?? "there"},</p>
        <p>Your 90-Day Design Prescription for <strong>${venue.name}</strong> is ready.</p>
        <p>Calm Index: ${calmIndex}/10</p>
        ${signedUrl ? `<p><a href="${signedUrl.signedUrl}">Download your PDF report</a> (link valid 7 days)</p>` : ""}
        <p>Book your 60-minute walkthrough call to discuss: ${process.env.NEXT_PUBLIC_CALENDLY_URL ?? "https://calendly.com/venuebydesign/60min"}</p>
      `,
      attachments: [{ filename: `diagnostic-${venue.name.replace(/\s+/g, "-")}.pdf`, content: Buffer.from(pdfBytes) }],
    });

    await db
      .update(diagnostics)
      .set({ emailSentAt: new Date() })
      .where(eq(diagnostics.id, diagnosticId));
  } catch (err) {
    captureException(err, { context: "diagnostic_report_generation", diagnosticId });
    return NextResponse.json(
      { error: "Report generation failed. Your responses were saved. We'll retry." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: diagnosticId, calmIndex, report });
}
