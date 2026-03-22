import Anthropic from "@anthropic-ai/sdk";
import type { Domain } from "@/lib/checkin-questions";

export interface Prescription {
  calmIndex: number;
  primaryDomain: Domain;
  primaryProblem: string;
  interventions: string[];
  weekFocus: string;
  watchSignal: string;
}

export interface PrescriptionInput {
  responses: Record<Domain, number>;
  calmIndex: number;
  venueName: string;
  venueType: string;
  staffCount: number | null;
}

const SYSTEM_PROMPT = `You are an expert hospitality operations consultant for Venue by Design.
You analyse weekly check-in data from venue operators and produce a structured "Prescription Brief"
to help them improve one area of their operations each week.

The seven operational domains are:
- throughput: Flow under pressure, rostering design, capacity
- defaults: Automatic behaviours, protocols, exception handling
- signals: Environmental communication to guests and staff
- pacing: Temporal load, pre-service prep, reset discipline
- endings: Peak-end rule, payment, farewell, final impression
- people_load: Emotional labour, cognitive load, hero culture
- operational_memory: Learning from failure, debrief, documentation

Each domain is scored 0-3 (0 = struggling, 3 = strength).
The Calm Index is (total/21)*10, ranging 0-10.

You MUST respond with valid JSON only, no markdown, no explanation.`;

function buildUserPrompt(input: PrescriptionInput): string {
  const scores = Object.entries(input.responses)
    .map(([domain, score]) => `  ${domain}: ${score}/3`)
    .join("\n");

  return `Weekly check-in data for "${input.venueName}" (${input.venueType}, ${input.staffCount ?? "unknown"} staff):

Domain Scores:
${scores}

Calm Index: ${input.calmIndex}/10

Based on these scores, generate a prescription brief. Identify the weakest domain as the primary focus. Return JSON matching this exact schema:

{
  "calmIndex": ${input.calmIndex},
  "primaryDomain": "<the lowest-scoring domain key>",
  "primaryProblem": "<1-2 sentence description of the core problem in this domain>",
  "interventions": ["<3-5 specific, actionable interventions for this week>"],
  "weekFocus": "<a single sentence summarising this week's focus>",
  "watchSignal": "<the one metric or behaviour to watch this week that signals improvement>"
}`;
}

export async function generatePrescription(
  input: PrescriptionInput,
  client?: Anthropic
): Promise<Prescription> {
  const anthropic = client ?? new Anthropic();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(input),
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Anthropic API");
  }

  const parsed = JSON.parse(textBlock.text) as Prescription;

  // Validate required fields
  if (
    typeof parsed.primaryDomain !== "string" ||
    typeof parsed.primaryProblem !== "string" ||
    !Array.isArray(parsed.interventions) ||
    typeof parsed.weekFocus !== "string" ||
    typeof parsed.watchSignal !== "string"
  ) {
    throw new Error("Invalid prescription schema from AI response");
  }

  // Ensure calmIndex matches input
  parsed.calmIndex = input.calmIndex;

  return parsed;
}

export { buildUserPrompt, SYSTEM_PROMPT };
