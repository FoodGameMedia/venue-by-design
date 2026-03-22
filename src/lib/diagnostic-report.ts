import Anthropic from "@anthropic-ai/sdk";
import type { DiagnosticQuestion } from "./diagnostic-questions";

export interface DiagnosticReport {
  executive_summary: string;
  calm_index_interpretation: string;
  domain_insights: Array<{
    domain: string;
    label: string;
    score: number;
    strengths: string[];
    improvements: string[];
  }>;
  ninety_day_prescription: {
    month_one: { focus: string; actions: string[] };
    month_two: { focus: string; actions: string[] };
    month_three: { focus: string; actions: string[] };
  };
  top_priorities: string[];
  watch_signals: string[];
}

export interface DiagnosticReportInput {
  responses: Record<string, number>;
  calmIndex: number;
  venueName: string;
  venueType?: string;
  staffCount?: number | null;
  questions: DiagnosticQuestion[];
}

const SYSTEM_PROMPT = `You are an expert hospitality operations consultant for Venue by Design.
You analyse a comprehensive 40-question diagnostic from venue operators and produce a structured 90-Day Design Prescription report.

The seven operational domains are:
- throughput: Flow under pressure, rostering design, capacity
- defaults: Automatic behaviours, protocols, exception handling
- signals: Environmental communication to guests and staff
- pacing: Temporal load, pre-service prep, reset discipline
- endings: Peak-end rule, payment, farewell, final impression
- people_load: Emotional labour, cognitive load, hero culture
- operational_memory: Learning from failure, debrief, documentation

Each question is scored 0-3 (0 = struggling, 3 = strength).
The Calm Index is (total/120)*10, ranging 0-10.

You MUST respond with valid JSON only, no markdown, no explanation.`;

function buildUserPrompt(input: DiagnosticReportInput): string {
  const scoresByDomain = new Map<string, { scores: number[]; total: number }>();
  for (const q of input.questions) {
    const score = input.responses[q.id] ?? 0;
    const existing = scoresByDomain.get(q.domain) ?? { scores: [], total: 0 };
    existing.scores.push(score);
    existing.total += score;
    scoresByDomain.set(q.domain, existing);
  }

  const domainSummary = Array.from(scoresByDomain.entries())
    .map(([domain, { scores, total }]) => {
      const avg = scores.length ? (total / scores.length).toFixed(2) : "0";
      return `  ${domain}: ${scores.join(",")} (avg ${avg})`;
    })
    .join("\n");

  return `Deep Diagnostic for "${input.venueName}" (${input.venueType ?? "venue"}, ${input.staffCount ?? "unknown"} staff)

Calm Index: ${input.calmIndex}/10

Domain scores (question scores, average):
${domainSummary}

Generate a 90-Day Design Prescription report. Return JSON matching this exact schema:

{
  "executive_summary": "<2-3 paragraph overview of the venue's operational health>",
  "calm_index_interpretation": "<what this score means for this operator>",
  "domain_insights": [
    {
      "domain": "<domain key>",
      "label": "<human label>",
      "score": <average for domain>,
      "strengths": ["<strength 1>", "<strength 2>"],
      "improvements": ["<improvement 1>", "<improvement 2>"]
    }
  ],
  "ninety_day_prescription": {
    "month_one": { "focus": "<theme>", "actions": ["<action 1>", "<action 2>", "<action 3>"] },
    "month_two": { "focus": "<theme>", "actions": ["<action 1>", "<action 2>", "<action 3>"] },
    "month_three": { "focus": "<theme>", "actions": ["<action 1>", "<action 2>", "<action 3>"] }
  },
  "top_priorities": ["<priority 1>", "<priority 2>", "<priority 3>", "<priority 4>", "<priority 5>"],
  "watch_signals": ["<metric/behaviour 1>", "<metric/behaviour 2>", "<metric/behaviour 3>"]
}`;
}

export async function generateDiagnosticReport(
  input: DiagnosticReportInput,
  client?: Anthropic
): Promise<DiagnosticReport> {
  const anthropic = client ?? new Anthropic();

  const message = await anthropic.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
    system: SYSTEM_PROMPT,
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Anthropic API");
  }

  let text = textBlock.text.trim();
  if (text.startsWith("```json")) text = text.slice(7);
  if (text.startsWith("```")) text = text.slice(3);
  if (text.endsWith("```")) text = text.slice(0, -3);
  text = text.trim();

  return JSON.parse(text) as DiagnosticReport;
}
