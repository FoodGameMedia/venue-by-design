/**
 * The audit call. One procedure in, three method question results and a verdict
 * out, judged through the venue's fragility profile.
 *
 * Mirrors the shape of `diagnostic-report.ts`: typed result, system prompt
 * carrying the method, an explicit JSON schema in the user prompt, fence
 * stripping, and an injectable client so the parse is testable without network.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_MODELS, createAnthropicClient } from "@/lib/anthropic-models";
import { DOMAIN_DEFINITIONS, DOMAIN_LABELS } from "@/lib/domains";
import { DOMAINS, type Domain } from "@/lib/checkin-questions";
import {
  METHOD_QUESTIONS,
  METHOD_QUESTION_IDS,
  verdictFor,
  type MethodQuestionId,
  type MethodQuestionResult,
  type ProcedureVerdict,
} from "./method-questions";
import { formatFragilityProfile, type FragilityProfile } from "./fragility";

/** Habit-format fields, extracted from the source where it contains them. */
export interface ExtractedHabitFields {
  theDefault: string | null;
  cue: string | null;
  routine: string[];
  reinforcement: string | null;
  ownerRole: string | null;
  reviewCadence: string | null;
}

export interface ProcedureAudit {
  title: string;
  domain: Domain | null;
  /** Id of the breakpoint it covers, from the profile. Null when it covers none. */
  breakpointId: string | null;
  questionResults: MethodQuestionResult[];
  verdict: ProcedureVerdict;
  summary: string;
  /** Present when the verdict is rewrite. What to change, in one or two lines. */
  rewriteNotes: string | null;
  fields: ExtractedHabitFields;
}

export interface ProcedureAuditInput {
  /** The procedure text, extracted from the upload or written by the operator. */
  body: string;
  /** Operator-supplied title, when there is one. */
  title?: string | null;
  venueName: string;
  profile: FragilityProfile;
}

const SYSTEM_PROMPT = `You are auditing standard operating procedures for Venue by Design, using the method from The Calm Venue by Julian Blok.

The method, in short. Most venues do not suffer from too few systems. They suffer from too many of the wrong ones: elaborate procedures written in a calm office for an imagined, disciplined staff, abandoned by the second hard Friday. A system is a default path that produces a reliable outcome without requiring heroics. It is not a document and it is not the binder. The minimum system set covers only the handful of moments where the absence of a default reliably produces a bad night.

The seven operational domains:
${DOMAINS.map((d) => `- ${d}: ${DOMAIN_LABELS[d as Domain]}, ${DOMAIN_DEFINITIONS[d as Domain]}`).join("\n")}

You judge one procedure against exactly three questions:
${METHOD_QUESTIONS.map((q) => `${q.number}. ${q.question}\n   Pass: ${q.pass}\n   Fail: ${q.fail}`).join("\n")}

Rules you must hold to:
- Judge what the procedure would do on a full Friday, not what it says about itself. Length, formatting and official tone are not evidence of a desire path.
- A procedure with no owner, no cue and no clear trigger is rarely a desire path.
- For question 2, only credit a real breakpoint from the venue's fragility map, or a domain the venue is currently under pressure on. Do not invent a breakpoint.
- Retiring is a win, not a gap. Do not soften a retire verdict to be kind.
- Be specific and plain. Write for a tired operator, not an auditor.
- Never use em dashes. Use commas, full stops or parentheses.

You MUST respond with valid JSON only, no markdown, no explanation.`;

function buildUserPrompt(input: ProcedureAuditInput): string {
  return `Venue: "${input.venueName}"

## The venue's fragility profile

${formatFragilityProfile(input.profile)}

## The procedure under audit

${input.title ? `Operator's title: ${input.title}\n` : ""}${input.body.trim()}

## What to return

Return JSON matching this exact schema:

{
  "title": "<plain, action-first name for this procedure, 8 words or fewer>",
  "domain": "<one of: ${DOMAINS.join(", ")}, or null if genuinely none fits>",
  "breakpoint_id": "<the id of the breakpoint from the fragility map this procedure covers, or null>",
  "question_results": [
    { "id": "desire_path", "pass": <true|false>, "rationale": "<one line, plain>" },
    { "id": "real_breakpoint", "pass": <true|false>, "rationale": "<one line, plain>" },
    { "id": "installs_default", "pass": <true|false>, "rationale": "<one line, plain>" }
  ],
  "summary": "<two or three sentences telling the operator what this procedure is and what to do with it>",
  "rewrite_notes": "<if it should be rewritten as a default, what to change, one or two lines. Otherwise null>",
  "fields": {
    "the_default": "<the decision, rule or buffer it installs, one line, or null if it installs none>",
    "cue": "<the fixed point in the day it attaches to, or null if it names none>",
    "routine": ["<ordered step>", "..."],
    "reinforcement": "<what visibly improves when it holds, or null if it names none>",
    "owner_role": "<a named role, never 'everyone', or null if it names none>",
    "review_cadence": "<when it is re-checked, or null if it names none>"
  }
}

Leave a field null when the source procedure genuinely does not contain it. Do not invent an owner, a cue or a cadence that is not there. A missing field is useful signal.`;
}

interface RawAudit {
  title?: unknown;
  domain?: unknown;
  breakpoint_id?: unknown;
  question_results?: unknown;
  summary?: unknown;
  rewrite_notes?: unknown;
  fields?: Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asDomain(value: unknown): Domain | null {
  return typeof value === "string" && (DOMAINS as readonly string[]).includes(value)
    ? (value as Domain)
    : null;
}

function parseQuestionResults(value: unknown): MethodQuestionResult[] {
  if (!Array.isArray(value)) {
    throw new Error("Audit response is missing question_results");
  }

  const byId = new Map<MethodQuestionId, MethodQuestionResult>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as { id?: unknown; pass?: unknown; rationale?: unknown };
    const id = METHOD_QUESTION_IDS.find((q) => q === row.id);
    if (!id) continue;
    byId.set(id, {
      id,
      pass: row.pass === true,
      rationale: asString(row.rationale) ?? "",
    });
  }

  const missing = METHOD_QUESTION_IDS.filter((id) => !byId.has(id));
  if (missing.length) {
    throw new Error(`Audit response is missing results for: ${missing.join(", ")}`);
  }

  return METHOD_QUESTION_IDS.map((id) => byId.get(id)!);
}

function parseFields(value: Record<string, unknown> | undefined): ExtractedHabitFields {
  const raw = value ?? {};
  const routine = Array.isArray(raw.routine)
    ? raw.routine.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    : [];

  return {
    theDefault: asString(raw.the_default),
    cue: asString(raw.cue),
    routine,
    reinforcement: asString(raw.reinforcement),
    ownerRole: asString(raw.owner_role),
    reviewCadence: asString(raw.review_cadence),
  };
}

/** Strip a markdown fence if the model wrapped the JSON in one. */
export function stripJsonFence(text: string): string {
  let out = text.trim();
  if (out.startsWith("```json")) out = out.slice(7);
  else if (out.startsWith("```")) out = out.slice(3);
  if (out.endsWith("```")) out = out.slice(0, -3);
  return out.trim();
}

/**
 * Parse a raw model response into a validated audit.
 *
 * The verdict is computed here from the three results rather than taken from
 * the model, so the rule stays in code and cannot drift between calls.
 */
export function parseProcedureAudit(
  text: string,
  profile: FragilityProfile
): ProcedureAudit {
  const raw = JSON.parse(stripJsonFence(text)) as RawAudit;

  const questionResults = parseQuestionResults(raw.question_results);
  const verdict = verdictFor(questionResults);

  const claimedBreakpoint = asString(raw.breakpoint_id);
  const breakpointId =
    claimedBreakpoint && profile.breakpoints.some((b) => b.id === claimedBreakpoint)
      ? claimedBreakpoint
      : null;

  return {
    title: asString(raw.title) ?? "Untitled procedure",
    domain: asDomain(raw.domain),
    breakpointId,
    questionResults,
    verdict,
    summary: asString(raw.summary) ?? "",
    rewriteNotes: verdict === "rewrite" ? asString(raw.rewrite_notes) : null,
    fields: parseFields(raw.fields),
  };
}

export const AUDIT_MODEL = ANTHROPIC_MODELS.sonnet;

export async function auditProcedure(
  input: ProcedureAuditInput,
  client?: Anthropic
): Promise<ProcedureAudit> {
  const anthropic = client ?? createAnthropicClient();

  const message = await anthropic.messages.create({
    model: AUDIT_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Anthropic API");
  }

  return parseProcedureAudit(textBlock.text, input.profile);
}
