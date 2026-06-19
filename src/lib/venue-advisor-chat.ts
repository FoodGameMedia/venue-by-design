import type Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_MODELS, createAnthropicClient } from "@/lib/anthropic-models";
import type { Domain } from "@/lib/checkin-questions";
import { formatBookExcerpts, type BookExcerpt } from "@/lib/book-retrieval";
import {
  CALM_BANDS,
  DOMAIN_DEFINITIONS,
  DOMAIN_GROUPS,
  DOMAIN_LABELS,
  getCalmBand,
} from "@/lib/domains";

export type { BookExcerpt };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface VenueContext {
  venueId: string;
  venueName: string;
  venueType: string | null;
  staffCount: number | null;
  domainScores: Partial<Record<Domain, number>> | null;
  latestCheckin: {
    calmIndex: number;
    responses: Partial<Record<Domain, number>>;
    createdAt: string;
  } | null;
  latestPrescription: {
    primaryDomain: string;
    primaryProblem: string;
    weekFocus: string;
    watchSignal: string;
    interventions: string[];
    createdAt: string;
  } | null;
}

export const CHAT_LIMITS = {
  maxMessagesInRequest: 20,
  maxMessageLength: 2000,
  maxMessagesPerHour: 30,
} as const;

const APP_HELP = `
## How Venue by Design works

Venue by Design (VBD) helps Australian hospitality operators run calmer, more resilient venues through a weekly loop:

1. **Weekly check-in** (/checkin or /score): Score each of the seven domains 0–3 for a normal trading week. Takes a few minutes, one question at a time.
2. **Calm Index**: Calculated from your scores — (total ÷ 21) × 10, giving a 0–10 map of how designed-for-calm your venue is. Not a grade; a map.
3. **Prescription Brief**: After each check-in, VBD generates a weekly focus — one domain, a clear problem statement, 3–5 interventions, and a watch signal.
4. **Dashboard** (/dashboard): See your Calm Index trend, domain radar, check-in history, and this week's prescription.
5. **Domains** (/domains): Reference all seven domains and their definitions.
6. **My Plan** (/my-plan): Your current prescription, progress, and diagnostic history if purchased.
7. **Deep Diagnostic** (/diagnostic): A one-time paid deep dive with a full report (requires purchase via /pricing).

The weekly loop is: check in → read your prescription → make one small change → check in again next week.
`.trim();

function formatDomainKnowledge(): string {
  const groups = DOMAIN_GROUPS.map(
    (g) =>
      `- **${g.label}**: ${g.domains.map((d) => `${DOMAIN_LABELS[d]} (${d}) — ${DOMAIN_DEFINITIONS[d]}`).join("; ")}`
  ).join("\n");

  const bands = CALM_BANDS.map((b) => `- ${b.label}: ${b.min}–${b.max}`).join("\n");

  return `
## The seven domains (grouped)

${groups}

## Calm Index bands

${bands}
`.trim();
}

export function buildSystemPrompt(
  context: VenueContext,
  bookExcerpts: BookExcerpt[] = []
): string {
  const calmBand = context.latestCheckin
    ? getCalmBand(context.latestCheckin.calmIndex).label
    : null;

  const venueSummary = JSON.stringify(
    {
      venueName: context.venueName,
      venueType: context.venueType,
      staffCount: context.staffCount,
      rollingDomainScores: context.domainScores,
      latestCheckin: context.latestCheckin
        ? {
            calmIndex: context.latestCheckin.calmIndex,
            calmBand,
            responses: context.latestCheckin.responses,
            date: context.latestCheckin.createdAt,
          }
        : null,
      latestPrescription: context.latestPrescription,
    },
    null,
    2
  );

  const bookSection = formatBookExcerpts(bookExcerpts);

  return `You are the Venue by Design advisor — a plain, warm hospitality operations consultant helping venue operators improve one area at a time.

Your voice: direct, practical, and encouraging. No jargon without explanation. Speak like a trusted colleague who knows service floors, not a corporate consultant. Use Australian English spelling where natural.

${formatDomainKnowledge()}

${APP_HELP}
${bookSection ? `\n\n${bookSection}` : ""}

## This operator's venue context

Use this data to personalise answers. Reference their venue by name when helpful. If they have no check-ins yet, guide them to complete their first weekly check-in.

\`\`\`json
${venueSummary}
\`\`\`

## How to respond

- Give **one small actionable step** they can try this week — not a laundry list.
- Use **concrete hospitality examples** (e.g. pre-service briefings, handover notes, queue management at the pass).
- Stay in scope: VBD domains, weekly loop, check-ins, prescriptions, diagnostics, and calm operations.
- Do **not** give legal, medical, HR legal, or financial advice. Defer to their lawyer, accountant, or HR advisor for those.
- Keep replies concise — 2–4 short paragraphs or a brief list. Ask a clarifying question only when truly needed.
- When book excerpts are provided above, ground answers in them and **cite the chapter** when possible.
- If no book excerpts match, use the domain definitions and practical hospitality guidance.
- Never invent scores or prescriptions — only reference what's in the venue context JSON.`;
}

export function validateChatMessages(
  raw: unknown
): { ok: true; messages: ChatMessage[] } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { messages?: unknown }).messages)) {
    return { ok: false, error: "messages array is required" };
  }

  const messages = (raw as { messages: unknown[] }).messages;

  if (messages.length === 0) {
    return { ok: false, error: "At least one message is required" };
  }

  if (messages.length > CHAT_LIMITS.maxMessagesInRequest) {
    return { ok: false, error: `Maximum ${CHAT_LIMITS.maxMessagesInRequest} messages per request` };
  }

  const parsed: ChatMessage[] = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      return { ok: false, error: "Invalid message format" };
    }
    const { role, content } = msg as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") {
      return { ok: false, error: "Message role must be user or assistant" };
    }
    if (typeof content !== "string" || !content.trim()) {
      return { ok: false, error: "Message content must be a non-empty string" };
    }
    if (content.length > CHAT_LIMITS.maxMessageLength) {
      return {
        ok: false,
        error: `Messages must be ${CHAT_LIMITS.maxMessageLength} characters or fewer`,
      };
    }
    parsed.push({ role, content: content.trim() });
  }

  const last = parsed[parsed.length - 1];
  if (last.role !== "user") {
    return { ok: false, error: "Last message must be from the user" };
  }

  return { ok: true, messages: parsed };
}

/** Simple in-memory rate limiter keyed by user id. Resets hourly. */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string): { allowed: true } | { allowed: false; error: string } {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return { allowed: true };
  }

  if (entry.count >= CHAT_LIMITS.maxMessagesPerHour) {
    return {
      allowed: false,
      error: "You've reached the hourly message limit. Please try again later.",
    };
  }

  entry.count += 1;
  return { allowed: true };
}

/** @internal Test helper */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

export async function chatWithAdvisor(
  messages: ChatMessage[],
  systemPrompt: string,
  client?: Anthropic
): Promise<string> {
  const anthropic = client ?? createAnthropicClient({ timeout: 25_000 });

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODELS.sonnet,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Anthropic API");
  }

  return textBlock.text.trim();
}
