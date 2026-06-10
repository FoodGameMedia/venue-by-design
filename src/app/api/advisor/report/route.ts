import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAdvisorByAuthId, advisorOwnsClient } from "@/lib/advisor";
import { generateAdvisorReportPdf } from "@/lib/advisor-pdf";
import { captureException } from "@/lib/sentry";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await getAdvisorByAuthId(authUser.id);
  if (!account) {
    return NextResponse.json({ error: "Advisor account not found" }, { status: 404 });
  }
  if (account.status !== "approved") {
    return NextResponse.json(
      { error: "Advisor account is not approved", status: account.status },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const venueId = typeof body.venueId === "string" ? body.venueId : "";
  if (!venueId) {
    return NextResponse.json({ error: "venueId is required" }, { status: 400 });
  }

  const owns = await advisorOwnsClient(account.id, venueId);
  if (!owns) {
    return NextResponse.json({ error: "Venue is not a linked client" }, { status: 403 });
  }

  try {
    const { pdfBytes, venueName } = await generateAdvisorReportPdf({
      venueId,
      businessName: account.businessName,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="diagnostic-${venueName.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (err) {
    captureException(err, { context: "advisor_report_generation", venueId });
    const message = err instanceof Error ? err.message : "Failed to generate report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
