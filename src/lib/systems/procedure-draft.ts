/**
 * Turning a ticked moment into a procedure.
 *
 * The spec's build flow: Claude drafts in the habit format, grounded through
 * the book retrieval layer so the tone and logic match the method rather than a
 * generic template, with the venue's own context written in.
 *
 * The interview comes first. The catalogue item already carries the book's cue
 * and owner, so the questions confirm and adjust rather than starting blank.
 * The operator's answers are the raw material; the model shapes them.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_MODELS, createAnthropicClient } from "@/lib/anthropic-models";
import { DOMAIN_DEFINITIONS, DOMAIN_LABELS } from "@/lib/domains";
import type { Domain } from "@/lib/checkin-questions";
import { stripJsonFence } from "./procedure-audit";
import type { ExtractedHabitFields } from "./procedure-audit";

/**
 * The interview. Five questions, one per habit-format field, in the order the
 * book installs them. The suggested answers come from the chapter, so an
 * operator in a hurry can accept them and still land on-method.
 */
export interface InterviewQuestion {
  id: keyof ExtractedHabitFields | "the_default";
  question: string;
  help: string;
  /** Pre-filled from the catalogue item, drawn from the book. */
  suggestion?: string;
}

export interface InterviewSubject {
  itemId: string;
  title: string;
  domain: Domain;
  /** The book's cue for this moment. */
  suggestedCue: string;
  /** The book's owner for this moment. */
  suggestedOwner: string;
  /** The breakpoint this exists to fix, when the tick came with one. */
  breakpoint?: { description: string; trigger: string } | null;
}

export function buildInterview(subject: InterviewSubject): InterviewQuestion[] {
  return [
    {
      id: "cue",
      question: "When does this happen?",
      help: "Name a fixed point that already exists in the day. A default that has to be remembered is not a default.",
      suggestion: subject.suggestedCue,
    },
    {
      id: "routine",
      question: "What happens now, step by step?",
      help: "Write what actually happens, not what is supposed to. Short is better. A default should be simpler than the rule it replaces.",
    },
    {
      id: "ownerRole",
      question: "Whose job is this?",
      help: "A role, never everyone. A job that belongs to everyone belongs to no one.",
      suggestion: subject.suggestedOwner,
    },
    {
      id: "reinforcement",
      question: "What will you see change when it holds?",
      help: "The felt payoff, the thing that makes it stick. If nothing visibly improves, it will not survive a hard Friday.",
    },
    {
      id: "the_default",
      question: "What is the one decision we can make once, so nobody decides it again?",
      help: "A decision made once, a rule made clear, or a buffer built in. This is the part that does the work.",
    },
  ];
}

export interface DraftInput {
  subject: InterviewSubject;
  venueName: string;
  venueType: string | null;
  /** The operator's answers, keyed by question id. Blanks are allowed. */
  answers: Record<string, string>;
  /** Relevant book excerpts, already formatted for injection. */
  bookExcerpts?: string;
}

export interface DraftedProcedure {
  title: string;
  fields: ExtractedHabitFields;
}

const SYSTEM_PROMPT = `You draft standard operating procedures for Venue by Design, using the method from The Calm Venue by Julian Blok.

You are writing one procedure, for one moment the operator has told you is missing or not working. You never write a library, and you never invent a second procedure.

A procedure in this method is a default path that produces a reliable outcome without requiring heroics. It installs a decision made once, a rule made clear, or a buffer built in. It is not a reminder, and it is not a policy.

The seven operational domains:
${(Object.keys(DOMAIN_LABELS) as Domain[]).map((d) => `- ${DOMAIN_LABELS[d]}: ${DOMAIN_DEFINITIONS[d]}`).join("\n")}

Rules you must hold to:
- Fewer steps is better. A default should be simpler than the rule it replaces. If you can cut a step, cut it. Six steps is usually too many.
- The cue must be a fixed point that already exists in the operator's day. Never invent a new meeting.
- The owner is a named role. Never "everyone", never "all staff", never "the team".
- The reinforcement is what visibly improves, not a motivational line.
- Write in the operator's own words where they gave you words. Do not smooth their voice into corporate prose.
- Where the operator left an answer blank, write the smallest sensible default for their kind of venue and keep it obviously editable.
- Never use em dashes. Use commas, full stops or parentheses.
- Australian spelling.

You MUST respond with valid JSON only, no markdown, no explanation.`;

function buildUserPrompt(input: DraftInput): string {
  const { subject, answers } = input;

  const answered = buildInterview(subject)
    .map((q) => {
      const given = answers[q.id]?.trim();
      const suggestion = q.suggestion ? ` (the book suggests: ${q.suggestion})` : "";
      return `${q.question}${suggestion}\nOperator said: ${given || "(left blank)"}`;
    })
    .join("\n\n");

  return `Venue: "${input.venueName}"${input.venueType ? `, a ${input.venueType}` : ""}

## The moment

${subject.title}
Domain: ${DOMAIN_LABELS[subject.domain]}
${
  subject.breakpoint
    ? `This exists to fix a named breakpoint: ${subject.breakpoint.description}. Trigger: ${subject.breakpoint.trigger}.`
    : "No breakpoint named yet for this one."
}

## The interview

${answered}
${input.bookExcerpts ? `\n${input.bookExcerpts}\n` : ""}
## What to return

Return JSON matching this exact schema:

{
  "title": "<plain, action-first name, 8 words or fewer>",
  "the_default": "<the decision, rule or buffer this installs, one line>",
  "cue": "<the fixed point in the day it attaches to>",
  "routine": ["<step>", "..."],
  "reinforcement": "<what visibly improves when it holds>",
  "owner_role": "<a named role, never everyone>",
  "review_cadence": "<when it is re-checked>"
}`;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseDraft(text: string): DraftedProcedure {
  const raw = JSON.parse(stripJsonFence(text)) as Record<string, unknown>;

  const routine = Array.isArray(raw.routine)
    ? raw.routine.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    : [];

  return {
    title: asString(raw.title) ?? "Untitled procedure",
    fields: {
      theDefault: asString(raw.the_default),
      cue: asString(raw.cue),
      routine,
      reinforcement: asString(raw.reinforcement),
      ownerRole: asString(raw.owner_role),
      reviewCadence: asString(raw.review_cadence),
    },
  };
}

export const DRAFT_MODEL = ANTHROPIC_MODELS.sonnet;

export async function draftProcedure(
  input: DraftInput,
  client?: Anthropic
): Promise<DraftedProcedure> {
  const anthropic = client ?? createAnthropicClient();

  const message = await anthropic.messages.create({
    model: DRAFT_MODEL,
    max_tokens: 1536,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Anthropic API");
  }

  return parseDraft(textBlock.text);
}
