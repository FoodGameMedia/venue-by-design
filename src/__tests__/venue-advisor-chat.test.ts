import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test-fake");

import {
  buildSystemPrompt,
  chatWithAdvisor,
  checkRateLimit,
  resetRateLimitStore,
  validateChatMessages,
  CHAT_LIMITS,
  type VenueContext,
} from "@/lib/venue-advisor-chat";
import type Anthropic from "@anthropic-ai/sdk";

function makeContext(overrides?: Partial<VenueContext>): VenueContext {
  return {
    venueId: "venue_1",
    venueName: "The Test Kitchen",
    venueType: "restaurant",
    staffCount: 12,
    domainScores: { throughput: 2, people_load: 0.5 },
    latestCheckin: {
      calmIndex: 4.3,
      responses: { throughput: 2, people_load: 0 },
      createdAt: "2026-06-01T00:00:00Z",
    },
    latestPrescription: {
      primaryDomain: "people_load",
      primaryProblem: "Team carrying unsustainable emotional labour.",
      weekFocus: "Introduce post-shift debriefs.",
      watchSignal: "Count debrief participation by Friday.",
      interventions: ["5-minute debrief", "Rotate stations"],
      createdAt: "2026-06-01T00:00:00Z",
    },
    ...overrides,
  };
}

function makeMockClient(responseText: string): Anthropic {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: responseText }],
      }),
    },
  } as unknown as Anthropic;
}

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimitStore();
});

describe("buildSystemPrompt", () => {
  it("includes domain definitions, groups, calm bands, and venue context", () => {
    const prompt = buildSystemPrompt(makeContext());

    expect(prompt).toContain("Venue by Design advisor");
    expect(prompt).toContain("Systems & Flow");
    expect(prompt).toContain("Throughput");
    expect(prompt).toContain("Flow under pressure");
    expect(prompt).toContain("Structural Risk");
    expect(prompt).toContain("The Test Kitchen");
    expect(prompt).toContain("people_load");
    expect(prompt).toContain("Weekly check-in");
    expect(prompt).toContain("one small actionable step");
  });

  it("handles venues with no check-ins yet", () => {
    const prompt = buildSystemPrompt(
      makeContext({
        domainScores: null,
        latestCheckin: null,
        latestPrescription: null,
      })
    );

    expect(prompt).toContain("The Test Kitchen");
    expect(prompt).toContain("first weekly check-in");
  });

  it("includes book excerpts when provided", () => {
    const prompt = buildSystemPrompt(makeContext(), [
      {
        bookId: "the-calm-venue",
        chapter: "Throughput",
        content: "Calm throughput means the pass stays readable.",
      },
    ]);

    expect(prompt).toContain("Book excerpts");
    expect(prompt).toContain("The Calm Venue — Throughput");
    expect(prompt).toContain("Calm throughput means the pass stays readable.");
    expect(prompt).toContain("cite the chapter");
  });
});

describe("validateChatMessages", () => {
  it("accepts valid user/assistant message history ending with user", () => {
    const result = validateChatMessages({
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
        { role: "user", content: "What should I focus on?" },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.messages).toHaveLength(3);
    }
  });

  it("rejects empty messages array", () => {
    const result = validateChatMessages({ messages: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("At least one");
    }
  });

  it("rejects when last message is not from user", () => {
    const result = validateChatMessages({
      messages: [{ role: "assistant", content: "Hi" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Last message must be from the user");
    }
  });

  it("rejects messages exceeding max length", () => {
    const result = validateChatMessages({
      messages: [{ role: "user", content: "x".repeat(CHAT_LIMITS.maxMessageLength + 1) }],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects too many messages in one request", () => {
    const messages = Array.from({ length: CHAT_LIMITS.maxMessagesInRequest + 1 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: "msg",
    }));
    const result = validateChatMessages({ messages });
    expect(result.ok).toBe(false);
  });
});

describe("checkRateLimit", () => {
  it("allows messages under the hourly limit", () => {
    for (let i = 0; i < CHAT_LIMITS.maxMessagesPerHour; i++) {
      expect(checkRateLimit("user_1").allowed).toBe(true);
    }
  });

  it("blocks messages over the hourly limit", () => {
    for (let i = 0; i < CHAT_LIMITS.maxMessagesPerHour; i++) {
      checkRateLimit("user_1");
    }
    const blocked = checkRateLimit("user_1");
    expect(blocked.allowed).toBe(false);
  });
});

describe("chatWithAdvisor", () => {
  it("returns trimmed text from Anthropic", async () => {
    const client = makeMockClient("  Focus on people load this week.  ");
    const reply = await chatWithAdvisor(
      [{ role: "user", content: "What should I do?" }],
      "system prompt",
      client
    );
    expect(reply).toBe("Focus on people load this week.");
  });
});

// ── API route ──────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/sentry", () => ({
  captureException: vi.fn(),
}));

const mockRetrieveBookChunks = vi.fn().mockResolvedValue([]);
vi.mock("@/lib/book-retrieval", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/book-retrieval")>();
  return {
    ...actual,
    retrieveBookChunks: (...args: unknown[]) => mockRetrieveBookChunks(...args),
  };
});

const mockMessagesCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: (...args: unknown[]) => mockMessagesCreate(...args),
    };
  },
}));

function chainMock(data: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data : [data], error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
}

async function getChatPost() {
  vi.resetModules();
  const mod = await import("@/app/api/chat/route");
  return mod.POST;
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    mockRetrieveBookChunks.mockResolvedValue([]);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth_1" } },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return chainMock([{ id: "user_1" }]);
      }
      if (table === "venues") {
        return chainMock({
          id: "venue_1",
          name: "The Test Kitchen",
          venue_type: "restaurant",
          staff_count: 10,
          user_id: "user_1",
        });
      }
      if (table === "domain_scores") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ domain: "throughput", score: 2 }],
          }),
        };
      }
      if (table === "checkins") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { calm_index: 5, responses: { throughput: 2 }, created_at: "2026-06-01" },
          }),
        };
      }
      if (table === "prescriptions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      return chainMock(null);
    });

    mockMessagesCreate.mockResolvedValue({
      content: [{ type: "text", text: "Try a five-minute pre-service briefing." }],
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const POST = await getChatPost();
    const res = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          venueId: "venue_1",
          messages: [{ role: "user", content: "Hello" }],
        }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when messages are invalid", async () => {
    const POST = await getChatPost();
    const res = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ venueId: "venue_1", messages: [] }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when venueId is missing", async () => {
    const POST = await getChatPost();
    const res = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello" }],
        }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns assistant message on success", async () => {
    const POST = await getChatPost();
    const res = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          venueId: "venue_1",
          messages: [{ role: "user", content: "What should I focus on?" }],
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Try a five-minute pre-service briefing.");
    expect(mockMessagesCreate).toHaveBeenCalled();
    expect(mockRetrieveBookChunks).toHaveBeenCalledWith("What should I focus on?", 6);
  });
});
