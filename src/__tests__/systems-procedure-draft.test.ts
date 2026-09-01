import { describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import {
  DRAFT_MODEL,
  buildInterview,
  draftProcedure,
  parseDraft,
  type InterviewSubject,
} from "@/lib/systems/procedure-draft";
import { CATALOGUE, getCatalogueItem } from "@/lib/systems/catalogue";

const SUBJECT: InterviewSubject = {
  itemId: "handover",
  title: "How one shift hands over to the next",
  domain: "throughput",
  suggestedCue: "The shift change, a fixed moment on the clock",
  suggestedOwner: "Outgoing shift lead, named on the roster",
  breakpoint: {
    description: "The Friday changeover falls apart",
    trigger: "Day team leaves before the night team is briefed",
  },
};

function response(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    title: "Run the Friday handover",
    the_default: "The night lead owns the last ten minutes of the day shift.",
    cue: "Shift change, 4pm",
    routine: ["Walk the pass", "Read the book", "Name the three risks"],
    reinforcement: "Nobody starts the night already behind.",
    owner_role: "Night lead",
    review_cadence: "Monthly",
    ...overrides,
  });
}

describe("buildInterview", () => {
  it("asks one question per habit-format field, in the book's order", () => {
    const questions = buildInterview(SUBJECT);
    expect(questions.map((q) => q.id)).toEqual([
      "cue",
      "routine",
      "ownerRole",
      "reinforcement",
      "the_default",
    ]);
  });

  it("pre-fills the cue and the owner from the book", () => {
    const questions = buildInterview(SUBJECT);
    expect(questions.find((q) => q.id === "cue")?.suggestion).toBe(SUBJECT.suggestedCue);
    expect(questions.find((q) => q.id === "ownerRole")?.suggestion).toBe(
      SUBJECT.suggestedOwner
    );
  });

  it("gives every question help that says why it matters", () => {
    for (const q of buildInterview(SUBJECT)) {
      expect(q.question.length).toBeGreaterThan(0);
      expect(q.help.length).toBeGreaterThan(0);
    }
  });

  it("pushes toward fewer steps and a named owner in its help text", () => {
    const questions = buildInterview(SUBJECT);
    expect(questions.find((q) => q.id === "routine")?.help).toContain("simpler");
    expect(questions.find((q) => q.id === "ownerRole")?.help).toContain("never everyone");
  });

  it("uses no em dashes", () => {
    const copy = buildInterview(SUBJECT)
      .flatMap((q) => [q.question, q.help, q.suggestion ?? ""])
      .join(" ");
    expect(copy).not.toMatch(/—/);
  });

  it("can be built from any catalogue item", () => {
    for (const item of CATALOGUE) {
      const questions = buildInterview({
        itemId: item.id,
        title: item.title,
        domain: item.domain,
        suggestedCue: item.cue,
        suggestedOwner: item.owner,
      });
      expect(questions).toHaveLength(5);
    }
  });
});

describe("parseDraft", () => {
  it("parses a clean response", () => {
    const draft = parseDraft(response());
    expect(draft.title).toBe("Run the Friday handover");
    expect(draft.fields.ownerRole).toBe("Night lead");
    expect(draft.fields.routine).toHaveLength(3);
  });

  it("parses a fenced response", () => {
    expect(parseDraft("```json\n" + response() + "\n```").fields.cue).toBe("Shift change, 4pm");
  });

  it("drops empty steps rather than shipping blanks", () => {
    const draft = parseDraft(response({ routine: ["Walk the pass", "", "   ", "Read the book"] }));
    expect(draft.fields.routine).toEqual(["Walk the pass", "Read the book"]);
  });

  it("falls back to a title rather than throwing", () => {
    expect(parseDraft(response({ title: "" })).title).toBe("Untitled procedure");
  });

  it("throws on malformed json", () => {
    expect(() => parseDraft("not json")).toThrow();
  });
});

describe("draftProcedure", () => {
  function clientReturning(text: string) {
    const create = vi.fn().mockResolvedValue({ content: [{ type: "text", text }] });
    return { client: { messages: { create } } as unknown as Anthropic, create };
  }

  it("calls sonnet and parses the reply", async () => {
    const { client, create } = clientReturning(response());
    const draft = await draftProcedure(
      { subject: SUBJECT, venueName: "The Rose", venueType: "restaurant", answers: {} },
      client
    );

    expect(create.mock.calls[0][0].model).toBe(DRAFT_MODEL);
    expect(DRAFT_MODEL).toBe("claude-sonnet-4-6");
    expect(draft.fields.theDefault).toContain("night lead");
  });

  it("puts the operator's answers and the breakpoint in the prompt", async () => {
    const { client, create } = clientReturning(response());
    await draftProcedure(
      {
        subject: SUBJECT,
        venueName: "The Rose",
        venueType: "restaurant",
        answers: { cue: "OPERATOR CUE MARKER", routine: "OPERATOR ROUTINE MARKER" },
      },
      client
    );

    const prompt = create.mock.calls[0][0].messages[0].content as string;
    expect(prompt).toContain("OPERATOR CUE MARKER");
    expect(prompt).toContain("OPERATOR ROUTINE MARKER");
    expect(prompt).toContain("The Friday changeover falls apart");
    expect(prompt).toContain("The Rose");
  });

  it("marks unanswered questions as blank rather than hiding them", async () => {
    const { client, create } = clientReturning(response());
    await draftProcedure(
      { subject: SUBJECT, venueName: "The Rose", venueType: null, answers: {} },
      client
    );
    expect(create.mock.calls[0][0].messages[0].content).toContain("(left blank)");
  });

  it("injects book excerpts when retrieval found any", async () => {
    const { client, create } = clientReturning(response());
    await draftProcedure(
      {
        subject: SUBJECT,
        venueName: "The Rose",
        venueType: null,
        answers: {},
        bookExcerpts: "BOOK EXCERPT MARKER",
      },
      client
    );
    expect(create.mock.calls[0][0].messages[0].content).toContain("BOOK EXCERPT MARKER");
  });

  it("tells the model never to write a library", async () => {
    const { client, create } = clientReturning(response());
    await draftProcedure(
      { subject: SUBJECT, venueName: "The Rose", venueType: null, answers: {} },
      client
    );
    const system = create.mock.calls[0][0].system as string;
    expect(system).toContain("never write a library");
    expect(system).toContain("Never \"everyone\"");
  });

  it("throws when the reply carries no text block", async () => {
    const create = vi.fn().mockResolvedValue({ content: [] });
    const client = { messages: { create } } as unknown as Anthropic;
    await expect(
      draftProcedure(
        { subject: SUBJECT, venueName: "The Rose", venueType: null, answers: {} },
        client
      )
    ).rejects.toThrow(/No text response/);
  });

  it("uses the catalogue item's own cue and owner as the suggestions", () => {
    const item = getCatalogueItem("welcome")!;
    const questions = buildInterview({
      itemId: item.id,
      title: item.title,
      domain: item.domain,
      suggestedCue: item.cue,
      suggestedOwner: item.owner,
    });
    expect(questions.find((q) => q.id === "cue")?.suggestion).toBe(
      "A guest crossing the threshold"
    );
  });
});
