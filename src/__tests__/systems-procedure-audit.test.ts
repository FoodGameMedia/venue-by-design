import { describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import {
  AUDIT_MODEL,
  auditProcedure,
  parseProcedureAudit,
  stripJsonFence,
} from "@/lib/systems/procedure-audit";
import { buildFragilityProfile } from "@/lib/systems/fragility";

const profile = buildFragilityProfile({
  breakpoints: [
    {
      id: "bp-1",
      description: "The Friday changeover falls apart",
      trigger: "Day team leaves before the night team is briefed",
      domain: "operational_memory",
    },
  ],
  domainScores: [
    { domain: "pacing", score: 0.8 },
    { domain: "operational_memory", score: 1.1 },
  ],
  calmIndex: 5.2,
});

function response(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    title: "Run the Friday handover",
    domain: "operational_memory",
    breakpoint_id: "bp-1",
    question_results: [
      { id: "desire_path", pass: true, rationale: "The team already does this." },
      { id: "real_breakpoint", pass: true, rationale: "Covers the Friday changeover." },
      { id: "installs_default", pass: true, rationale: "Fixed handover slot, one owner." },
    ],
    summary: "This one is carrying weight.",
    rewrite_notes: null,
    fields: {
      the_default: "The night lead owns the last ten minutes of the day shift.",
      cue: "Shift change",
      routine: ["Walk the pass", "Read the book", "Name the risks"],
      reinforcement: "Nobody starts the night already behind.",
      owner_role: "Night lead",
      review_cadence: "Monthly",
    },
    ...overrides,
  });
}

describe("stripJsonFence", () => {
  it("removes a json fence", () => {
    expect(stripJsonFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("removes a bare fence", () => {
    expect(stripJsonFence('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("leaves unfenced json alone", () => {
    expect(stripJsonFence('  {"a":1}  ')).toBe('{"a":1}');
  });
});

describe("parseProcedureAudit", () => {
  it("parses a clean response", () => {
    const audit = parseProcedureAudit(response(), profile);

    expect(audit.title).toBe("Run the Friday handover");
    expect(audit.domain).toBe("operational_memory");
    expect(audit.breakpointId).toBe("bp-1");
    expect(audit.verdict).toBe("keep");
    expect(audit.fields.routine).toHaveLength(3);
    expect(audit.fields.ownerRole).toBe("Night lead");
  });

  it("parses a fenced response", () => {
    const audit = parseProcedureAudit("```json\n" + response() + "\n```", profile);
    expect(audit.verdict).toBe("keep");
  });

  it("computes the verdict in code rather than trusting the model", () => {
    const audit = parseProcedureAudit(
      response({
        question_results: [
          { id: "desire_path", pass: false, rationale: "Nobody follows it." },
          { id: "real_breakpoint", pass: true, rationale: "Covers the changeover." },
          { id: "installs_default", pass: true, rationale: "Names an owner." },
        ],
        // A model claiming "keep" here must not win.
        verdict: "keep",
      }),
      profile
    );
    expect(audit.verdict).toBe("retire");
  });

  it("keeps rewrite notes only when the verdict is rewrite", () => {
    const rewrite = parseProcedureAudit(
      response({
        question_results: [
          { id: "desire_path", pass: true, rationale: "They do it." },
          { id: "real_breakpoint", pass: true, rationale: "Covers it." },
          { id: "installs_default", pass: false, rationale: "It is a reminder, not a default." },
        ],
        rewrite_notes: "Give it an owner and a fixed cue.",
      }),
      profile
    );
    expect(rewrite.verdict).toBe("rewrite");
    expect(rewrite.rewriteNotes).toBe("Give it an owner and a fixed cue.");

    const keep = parseProcedureAudit(
      response({ rewrite_notes: "Ignore me." }),
      profile
    );
    expect(keep.rewriteNotes).toBeNull();
  });

  it("rejects a breakpoint id the venue does not have", () => {
    const audit = parseProcedureAudit(response({ breakpoint_id: "bp-invented" }), profile);
    expect(audit.breakpointId).toBeNull();
  });

  it("rejects a domain that is not one of the seven", () => {
    const audit = parseProcedureAudit(response({ domain: "vibes" }), profile);
    expect(audit.domain).toBeNull();
  });

  it("keeps null habit fields null rather than inventing them", () => {
    const audit = parseProcedureAudit(
      response({
        fields: {
          the_default: null,
          cue: null,
          routine: [],
          reinforcement: null,
          owner_role: null,
          review_cadence: null,
        },
      }),
      profile
    );
    expect(audit.fields.ownerRole).toBeNull();
    expect(audit.fields.cue).toBeNull();
    expect(audit.fields.routine).toEqual([]);
  });

  it("throws when a question result is missing", () => {
    expect(() =>
      parseProcedureAudit(
        response({
          question_results: [{ id: "desire_path", pass: true, rationale: "x" }],
        }),
        profile
      )
    ).toThrow(/real_breakpoint/);
  });

  it("throws on malformed json", () => {
    expect(() => parseProcedureAudit("not json at all", profile)).toThrow();
  });

  it("falls back to a title rather than throwing", () => {
    const audit = parseProcedureAudit(response({ title: "" }), profile);
    expect(audit.title).toBe("Untitled procedure");
  });
});

describe("auditProcedure", () => {
  it("calls the sonnet model and parses the reply", async () => {
    const create = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: response() }],
    });
    const client = { messages: { create } } as unknown as Anthropic;

    const audit = await auditProcedure(
      { body: "The Friday handover procedure, at length.", venueName: "The Rose", profile },
      client
    );

    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0].model).toBe(AUDIT_MODEL);
    expect(AUDIT_MODEL).toBe("claude-sonnet-4-6");
    expect(audit.verdict).toBe("keep");
  });

  it("puts the fragility profile and the procedure in the prompt", async () => {
    const create = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: response() }],
    });
    const client = { messages: { create } } as unknown as Anthropic;

    await auditProcedure(
      { body: "PROCEDURE BODY MARKER", venueName: "The Rose", profile },
      client
    );

    const prompt = create.mock.calls[0][0].messages[0].content as string;
    expect(prompt).toContain("PROCEDURE BODY MARKER");
    expect(prompt).toContain("The Friday changeover falls apart");
    expect(prompt).toContain("The Rose");
  });

  it("throws when the reply carries no text block", async () => {
    const create = vi.fn().mockResolvedValue({ content: [] });
    const client = { messages: { create } } as unknown as Anthropic;

    await expect(
      auditProcedure({ body: "x".repeat(40), venueName: "The Rose", profile }, client)
    ).rejects.toThrow(/No text response/);
  });
});
