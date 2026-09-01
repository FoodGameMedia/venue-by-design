"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface InterviewQuestionView {
  id: string;
  question: string;
  help: string;
  suggestion?: string;
  /** The routine answer wants room. Everything else is one line. */
  multiline?: boolean;
}

export interface ExistingBreakpoint {
  id: string;
  description: string;
  trigger: string;
}

export function InterviewForm({
  venueId,
  itemId,
  questions,
  needsBreakpoint,
  existingBreakpoints,
}: {
  venueId: string;
  itemId: string;
  questions: InterviewQuestionView[];
  /** True when this was ticked as not working and is not yet on the map. */
  needsBreakpoint: boolean;
  /** Already on the map. Offered first, so the same bad night is not named twice. */
  existingBreakpoints: ExistingBreakpoint[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, q.suggestion ?? ""]))
  );
  const [trigger, setTrigger] = useState("");
  const [linkTo, setLinkTo] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // Put it on the fragility map first, so the draft knows what it fixes.
      // Linking to one already named costs no slot and avoids describing the
      // same bad night twice.
      if (needsBreakpoint && (linkTo || trigger.trim())) {
        const res = await fetch("/api/systems/catalogue/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            venueId,
            itemId,
            action: "promote",
            trigger,
            existingBreakpointId: linkTo || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Could not add that to your fragility map.");
          return;
        }
      }

      const res = await fetch("/api/systems/catalogue/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, itemId, answers }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not write that procedure.");
        return;
      }

      router.push(`/systems/${data.procedure.id}`);
    } catch {
      setError("Could not write that procedure.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-8" data-testid="interview-form">
      {needsBreakpoint && (
        <div className="border-l-[3px] border-champagne bg-card p-5">
          <p className="vbd-section-label-accent">First, the small thing</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You said you have this and it is not working. That makes it a breakpoint. Name the
            small thing that starts it going wrong and it goes on your fragility map, so the
            audit can see it.
          </p>
          {existingBreakpoints.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="link-breakpoint">Is this one you have already named?</Label>
              <select
                id="link-breakpoint"
                value={linkTo}
                onChange={(e) => setLinkTo(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">No, this is a new one</option>
                {existingBreakpoints.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Linking to one you already have costs no slot on the map, and stops the same bad
                night being written down twice.
              </p>
            </div>
          )}

          {!linkTo && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="trigger">What starts it?</Label>
              <Input
                id="trigger"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="Day team leaves before the night team is briefed"
                maxLength={300}
              />
            </div>
          )}
        </div>
      )}

      {questions.map((question) => (
        <div key={question.id} className="space-y-2">
          <Label htmlFor={question.id}>{question.question}</Label>
          <p className="text-xs leading-relaxed text-muted-foreground">{question.help}</p>
          {question.multiline ? (
            <textarea
              id={question.id}
              rows={6}
              value={answers[question.id] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-foreground"
            />
          ) : (
            <Input
              id={question.id}
              value={answers[question.id] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
              }
              maxLength={300}
            />
          )}
          {question.suggestion && (
            <p className="text-xs text-muted-foreground">
              Pre-filled from the book. Change it if your venue works differently.
            </p>
          )}
        </div>
      ))}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Writing it…" : "Write the procedure"}
        </Button>
        <span className="text-xs text-muted-foreground">
          You can leave anything blank. We will write the smallest sensible default and you can
          edit it.
        </span>
      </div>
    </form>
  );
}
