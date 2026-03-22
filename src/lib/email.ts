import { Resend } from "resend";
import { PrescriptionBriefEmail } from "@/emails/prescription-brief";
import { render } from "@react-email/components";

const FROM_EMAIL = "hello@send.venuebydesign.com.au";

export interface PrescriptionEmailData {
  to: string;
  operatorName: string;
  venueName: string;
  calmIndex: number;
  primaryDomain: string;
  primaryProblem: string;
  interventions: string[];
  weekFocus: string;
  watchSignal: string;
}

export async function sendPrescriptionEmail(
  data: PrescriptionEmailData,
  resendClient?: Resend
): Promise<{ id: string }> {
  const resend = resendClient ?? new Resend(process.env.RESEND_API_KEY);

  const html = await render(
    PrescriptionBriefEmail({
      operatorName: data.operatorName,
      venueName: data.venueName,
      calmIndex: data.calmIndex,
      primaryDomain: data.primaryDomain,
      primaryProblem: data.primaryProblem,
      interventions: data.interventions,
      weekFocus: data.weekFocus,
      watchSignal: data.watchSignal,
    })
  );

  const result = await resend.emails.send({
    from: `Venue by Design <${FROM_EMAIL}>`,
    to: data.to,
    subject: `Your Weekly Prescription Brief — Calm Index: ${data.calmIndex}/10`,
    html,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  return { id: result.data?.id ?? "unknown" };
}
