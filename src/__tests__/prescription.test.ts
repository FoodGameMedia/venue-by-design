import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test-fake");

import { generatePrescription, type PrescriptionInput } from "@/lib/prescription";
import type Anthropic from "@anthropic-ai/sdk";

// ── Helpers ──────────────────────────────────────────────────────────────────────

const VALID_PRESCRIPTION = {
  calmIndex: 4.3,
  primaryDomain: "people_load",
  primaryProblem: "Your team is carrying unsustainable emotional labour with no debrief or rotation system.",
  interventions: [
    "Implement a 5-minute post-shift debrief for front-of-house staff",
    "Rotate high-stress stations weekly",
    "Introduce a buddy system for new hires during peak service",
  ],
  weekFocus: "Reduce emotional load on front-of-house by introducing structured debriefs after each shift.",
  watchSignal: "Track how many staff voluntarily share a challenge in the post-shift debrief by Friday.",
};

function makeInput(overrides?: Partial<PrescriptionInput>): PrescriptionInput {
  return {
    responses: {
      throughput: 2,
      defaults: 1,
      signals: 2,
      pacing: 1,
      endings: 2,
      people_load: 0,
      operational_memory: 1,
    },
    calmIndex: 4.3,
    venueName: "The Test Kitchen",
    venueType: "restaurant",
    staffCount: 12,
    ...overrides,
  };
}

function makeMockClient(response: unknown): Anthropic {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify(response),
          },
        ],
      }),
    },
  } as unknown as Anthropic;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generatePrescription", () => {
  it("returns a valid prescription from the AI response", async () => {
    const client = makeMockClient(VALID_PRESCRIPTION);
    const result = await generatePrescription(makeInput(), client);

    expect(result.primaryDomain).toBe("people_load");
    expect(result.primaryProblem).toContain("emotional labour");
    expect(result.interventions).toHaveLength(3);
    expect(result.weekFocus).toBeTruthy();
    expect(result.watchSignal).toBeTruthy();
    expect(result.calmIndex).toBe(4.3);
  });

  it("overrides calmIndex with the input value", async () => {
    const wrongCalm = { ...VALID_PRESCRIPTION, calmIndex: 9.9 };
    const client = makeMockClient(wrongCalm);
    const result = await generatePrescription(makeInput(), client);

    expect(result.calmIndex).toBe(4.3); // should use input, not AI response
  });

  it("passes venue context to the API", async () => {
    const client = makeMockClient(VALID_PRESCRIPTION);
    const input = makeInput({ venueName: "My Bar", venueType: "bar", staffCount: 5 });
    await generatePrescription(input, client);

    const createCall = vi.mocked(client.messages.create);
    const messages = createCall.mock.calls[0][0].messages;
    const userMsg = messages[0].content as string;

    expect(userMsg).toContain("My Bar");
    expect(userMsg).toContain("bar");
    expect(userMsg).toContain("5 staff");
  });

  it("throws on empty AI response", async () => {
    const client = {
      messages: {
        create: vi.fn().mockResolvedValue({ content: [] }),
      },
    } as unknown as Anthropic;

    await expect(generatePrescription(makeInput(), client)).rejects.toThrow(
      "No text response from Anthropic API"
    );
  });

  it("throws on invalid JSON structure", async () => {
    const client = makeMockClient({ foo: "bar" }); // missing required fields

    await expect(generatePrescription(makeInput(), client)).rejects.toThrow(
      "Invalid prescription schema"
    );
  });

  it("throws on non-JSON response", async () => {
    const client = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: "I cannot generate a prescription because..." }],
        }),
      },
    } as unknown as Anthropic;

    await expect(generatePrescription(makeInput(), client)).rejects.toThrow();
  });

  it("handles API error gracefully", async () => {
    const client = {
      messages: {
        create: vi.fn().mockRejectedValue(new Error("API rate limit exceeded")),
      },
    } as unknown as Anthropic;

    await expect(generatePrescription(makeInput(), client)).rejects.toThrow(
      "API rate limit exceeded"
    );
  });

  it("uses claude-sonnet model", async () => {
    const client = makeMockClient(VALID_PRESCRIPTION);
    await generatePrescription(makeInput(), client);

    const createCall = vi.mocked(client.messages.create);
    expect(createCall.mock.calls[0][0].model).toContain("sonnet");
  });

  it("includes all seven domains in the prompt", async () => {
    const client = makeMockClient(VALID_PRESCRIPTION);
    await generatePrescription(makeInput(), client);

    const createCall = vi.mocked(client.messages.create);
    const userMsg = createCall.mock.calls[0][0].messages[0].content as string;

    expect(userMsg).toContain("throughput: 2/3");
    expect(userMsg).toContain("defaults: 1/3");
    expect(userMsg).toContain("signals: 2/3");
    expect(userMsg).toContain("pacing: 1/3");
    expect(userMsg).toContain("endings: 2/3");
    expect(userMsg).toContain("people_load: 0/3");
    expect(userMsg).toContain("operational_memory: 1/3");
  });
});
