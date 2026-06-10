"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CHECKIN_QUESTIONS,
  SCORE_LABELS,
  type Domain,
} from "@/lib/checkin-questions";

type Responses = Partial<Record<Domain, number>>;

export function CheckinForm({
  venueId,
  userId,
  venueName,
}: {
  venueId: string;
  userId: string;
  venueName: string;
}) {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Responses>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ calmIndex: number } | null>(null);

  const question = CHECKIN_QUESTIONS[step];
  const value = responses[question.domain] ?? null;
  const isLast = step === CHECKIN_QUESTIONS.length - 1;

  function handleScore(s: number) {
    setResponses((r) => ({ ...r, [question.domain]: s }));
  }

  function handleNext() {
    if (value === null) return;
    if (isLast) {
      submitCheckin();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function submitCheckin() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          responses: { ...responses, [question.domain]: value } as Record<Domain, number>,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save check-in");
      }
      const data = await res.json();
      setResult({ calmIndex: data.calmIndex });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 sm:px-6">
        <div className="w-full max-w-[375px] border-l-4 border-primary bg-card p-6">
          <h1 className="font-serif text-2xl text-foreground">Your Calm Index</h1>
          <p className="mt-1 text-muted-foreground">{venueName}</p>
          <div className="mt-8 flex flex-col items-center">
            <span
              className="font-serif text-[64px] leading-none text-primary"
              data-testid="calm-index-result"
            >
              {result.calmIndex}
            </span>
            <p className="mt-2 text-sm text-muted-foreground">out of 10</p>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            A higher score means your venue is running with less friction and more
            predictable flow.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/dashboard" className="cursor-pointer">
              <Button className="w-full">
                Back to dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((step + 1) / CHECKIN_QUESTIONS.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8 sm:px-6">
      <header className="mx-auto w-full max-w-[375px]">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="cursor-pointer text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            ← Back
          </Link>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Step {step + 1} of {CHECKIN_QUESTIONS.length}
          </span>
        </div>
        <div className="mt-3 h-1 w-full bg-muted">
          <div
            className="h-1 bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto mt-6 w-full max-w-[375px] flex-1">
        <div className="border-l-4 border-primary bg-card p-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {question.domain.replace(/_/g, " ")}
          </p>
          <h2 className="mt-2 font-serif text-xl leading-snug text-foreground">
            {question.question}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{question.description}</p>

          <div className="mt-8 space-y-3">
            {SCORE_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleScore(i)}
                className={`block w-full cursor-pointer border px-4 py-3 text-left text-sm transition-colors duration-200 ${
                  value === i
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
                data-testid={`score-${i}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 border-input"
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              disabled={value === null || loading}
              className="flex-1 disabled:opacity-50"
              data-testid="next-btn"
            >
              {loading ? "Saving…" : isLast ? "See result" : "Next"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
