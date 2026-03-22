import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("RESEND_API_KEY", "re_test_fake");

import { sendPrescriptionEmail, type PrescriptionEmailData } from "@/lib/email";
import type { Resend } from "resend";

// ── Helpers ──────────────────────────────────────────────────────────────────────

function makeEmailData(overrides?: Partial<PrescriptionEmailData>): PrescriptionEmailData {
  return {
    to: "operator@example.com",
    operatorName: "Julian",
    venueName: "The Test Kitchen",
    calmIndex: 4.3,
    primaryDomain: "people_load",
    primaryProblem: "Your team is carrying unsustainable emotional load.",
    interventions: [
      "Implement post-shift debriefs",
      "Rotate high-stress stations",
      "Introduce buddy system for new hires",
    ],
    weekFocus: "Reduce emotional load through structured debriefs.",
    watchSignal: "Track debrief participation by Friday.",
    ...overrides,
  };
}

function makeMockResend(response: { data: { id: string } | null; error: null | { message: string; name: string } }) {
  return {
    emails: {
      send: vi.fn().mockResolvedValue(response),
    },
  } as unknown as Resend;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendPrescriptionEmail", () => {
  it("sends an email with the correct from address", async () => {
    const resend = makeMockResend({ data: { id: "email_123" }, error: null });
    await sendPrescriptionEmail(makeEmailData(), resend);

    const sendCall = vi.mocked(resend.emails.send);
    expect(sendCall).toHaveBeenCalledTimes(1);

    const args = sendCall.mock.calls[0][0];
    expect(args.from).toContain("hello@send.venuebydesign.com.au");
  });

  it("sends to the correct recipient", async () => {
    const resend = makeMockResend({ data: { id: "email_123" }, error: null });
    await sendPrescriptionEmail(makeEmailData({ to: "custom@example.com" }), resend);

    const args = vi.mocked(resend.emails.send).mock.calls[0][0];
    expect(args.to).toBe("custom@example.com");
  });

  it("includes the Calm Index in the subject line", async () => {
    const resend = makeMockResend({ data: { id: "email_123" }, error: null });
    await sendPrescriptionEmail(makeEmailData({ calmIndex: 7.1 }), resend);

    const args = vi.mocked(resend.emails.send).mock.calls[0][0];
    expect(args.subject).toContain("7.1/10");
  });

  it("returns the email ID on success", async () => {
    const resend = makeMockResend({ data: { id: "email_456" }, error: null });
    const result = await sendPrescriptionEmail(makeEmailData(), resend);

    expect(result.id).toBe("email_456");
  });

  it("throws on Resend API error", async () => {
    const resend = makeMockResend({ data: null, error: { message: "Invalid API key", name: "validation_error" } });

    await expect(sendPrescriptionEmail(makeEmailData(), resend)).rejects.toThrow(
      "Resend error: Invalid API key"
    );
  });

  it("renders HTML with all prescription data", async () => {
    const resend = makeMockResend({ data: { id: "email_123" }, error: null });
    await sendPrescriptionEmail(makeEmailData(), resend);

    const args = vi.mocked(resend.emails.send).mock.calls[0][0];
    const html = args.html as string;

    expect(html).toContain("The Test Kitchen");
    expect(html).toContain("4.3/10");
    expect(html).toContain("People Load");
    expect(html).toContain("unsustainable emotional load");
    expect(html).toContain("post-shift debriefs");
    expect(html).toContain("structured debriefs");
    expect(html).toContain("debrief participation");
    expect(html).toContain("Julian");
  });

  it("sends from Venue by Design brand", async () => {
    const resend = makeMockResend({ data: { id: "email_123" }, error: null });
    await sendPrescriptionEmail(makeEmailData(), resend);

    const args = vi.mocked(resend.emails.send).mock.calls[0][0];
    expect(args.from).toContain("Venue by Design");
  });
});
