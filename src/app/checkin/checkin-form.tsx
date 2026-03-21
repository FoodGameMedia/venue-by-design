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
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[375px] rounded-xl border border-[#3C3F43]/20 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-serif text-[#1A1A1A]">Your Calm Index</h1>
          <p className="mt-1 text-[#3C3F43]">{venueName}</p>
          <div className="mt-8 flex flex-col items-center">
            <span
              className="text-5xl font-serif text-[#B9704B]"
              data-testid="calm-index-result"
            >
              {result.calmIndex}
            </span>
            <p className="mt-2 text-sm text-[#3C3F43]">out of 10</p>
          </div>
          <p className="mt-6 text-sm text-[#3C3F43]">
            A higher score means your venue is running with less friction and more
            predictable flow.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/dashboard">
              <Button className="w-full bg-[#B9704B] hover:bg-[#A3603B] text-white">
                Back to dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-[#3C3F43] hover:text-[#1A1A1A]">
          ← Back
        </Link>
        <span className="text-sm text-[#3C3F43]">
          {step + 1} of {CHECKIN_QUESTIONS.length}
        </span>
      </header>

      <main className="mx-auto w-full max-w-[375px] flex-1">
        <div className="rounded-xl border border-[#3C3F43]/20 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[#B9704B]">
            {question.domain.replace(/_/g, " ")}
          </p>
          <h2 className="mt-2 text-xl font-serif text-[#1A1A1A] leading-snug">
            {question.question}
          </h2>
          <p className="mt-1 text-sm text-[#3C3F43]/80">{question.description}</p>

          <div className="mt-8 space-y-3">
            {SCORE_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleScore(i)}
                className={`block w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  value === i
                    ? "border-[#B9704B] bg-[#B9704B]/10 text-[#1A1A1A]"
                    : "border-[#3C3F43]/20 bg-white text-[#3C3F43] hover:border-[#3C3F43]/40"
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
                className="flex-1 border-[#3C3F43]/30"
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              disabled={value === null || loading}
              className="flex-1 bg-[#B9704B] hover:bg-[#A3603B] text-white disabled:opacity-50"
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
