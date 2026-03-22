import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test-fake");

import { generateDiagnosticReport, type DiagnosticReport } from "@/lib/diagnostic-report";
import type Anthropic from "@anthropic-ai/sdk";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/diagnostic-questions";

const VALID_REPORT: DiagnosticReport = {
  executive_summary: "Your venue shows strengths in throughput and pacing.",
  calm_index_interpretation: "A 6.5/10 indicates solid foundations with room to grow.",
  domain_insights: [
    {
      domain: "throughput",
      label: "Throughput",
      score: 2.2,
      strengths: ["Good prep"],
      improvements: ["Improve rostering"],
    },
  ],
  ninety_day_prescription: {
    month_one: { focus: "Defaults", actions: ["Action 1", "Action 2"] },
    month_two: { focus: "Signals", actions: ["Action 1"] },
    month_three: { focus: "Endings", actions: ["Action 1"] },
  },
  top_priorities: ["Priority 1", "Priority 2"],
  watch_signals: ["Signal 1", "Signal 2"],
};

function makeMockClient(response: unknown): Anthropic {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(response) }],
      }),
    },
  } as unknown as Anthropic;
}

const responses: Record<string, number> = {};
DIAGNOSTIC_QUESTIONS.forEach((q, i) => {
  responses[q.id] = i % 4;
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateDiagnosticReport", () => {
  it("returns a valid report from the AI response", async () => {
    const client = makeMockClient(VALID_REPORT);
    const result = await generateDiagnosticReport(
      {
        responses,
        calmIndex: 6.5,
        venueName: "Test Venue",
        venueType: "restaurant",
        staffCount: 10,
        questions: DIAGNOSTIC_QUESTIONS,
      },
      client
    );

    expect(result.executive_summary).toBeTruthy();
    expect(result.calm_index_interpretation).toContain("6.5");
    expect(result.domain_insights).toHaveLength(1);
    expect(result.ninety_day_prescription.month_one.focus).toBe("Defaults");
    expect(result.top_priorities).toHaveLength(2);
  });

  it("uses claude-opus model", async () => {
    const client = makeMockClient(VALID_REPORT);
    await generateDiagnosticReport(
      { responses, calmIndex: 5, venueName: "V", questions: DIAGNOSTIC_QUESTIONS },
      client
    );

    const createCall = vi.mocked(client.messages.create);
    expect(createCall.mock.calls[0][0].model).toContain("opus");
  });

  it("passes venue context to the API", async () => {
    const client = makeMockClient(VALID_REPORT);
    await generateDiagnosticReport(
      {
        responses,
        calmIndex: 5,
        venueName: "My Café",
        venueType: "cafe",
        staffCount: 8,
        questions: DIAGNOSTIC_QUESTIONS,
      },
      client
    );

    const createCall = vi.mocked(client.messages.create);
    const userMsg = createCall.mock.calls[0][0].messages[0].content as string;
    expect(userMsg).toContain("My Café");
    expect(userMsg).toContain("cafe");
  });
});
