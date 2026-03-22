"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DIAGNOSTIC_QUESTIONS,
  SCORE_LABELS,
  getQuestionsByDomain,
  type DiagnosticDomain,
} from "@/lib/diagnostic-questions";

const DOMAIN_LABELS: Record<DiagnosticDomain, string> = {
  throughput: "Throughput",
  defaults: "Defaults",
  signals: "Signals",
  pacing: "Pacing",
  endings: "Endings",
  people_load: "People Load",
  operational_memory: "Operational Memory",
};

type Responses = Partial<Record<string, number>>;

export function DiagnosticForm({
  venueId,
  userId,
  venueName,
}: {
  venueId: string;
  userId: string;
  venueName: string;
}) {
  const byDomain = useMemo(() => getQuestionsByDomain(), []);
  const domains = Array.from(byDomain.keys());
  const [domainStep, setDomainStep] = useState(0);
  const domain = domains[domainStep];
  const questions = byDomain.get(domain) ?? [];
  const [responses, setResponses] = useState<Responses>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ calmIndex: number; diagnosticId: string } | null>(null);

  const currentQIdx = 0;
  const question = questions[currentQIdx];
  const allAnswered = questions.every((q) => responses[q.id] !== undefined);
  const isLastDomain = domainStep === domains.length - 1;

  function handleScore(qId: string, s: number) {
    setResponses((r) => ({ ...r, [qId]: s }));
  }

  function handleNext() {
    if (!allAnswered) return;
    if (isLastDomain) {
      submitDiagnostic();
    } else {
      setDomainStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (domainStep > 0) setDomainStep((s) => s - 1);
  }

  async function submitDiagnostic() {
    setLoading(true);
    try {
      const res = await fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, responses }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to submit diagnostic");
      }
      const data = await res.json();
      setResult({ calmIndex: data.calmIndex ?? 0, diagnosticId: data.id });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[375px] rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-serif text-foreground">Diagnostic submitted</h1>
          <p className="mt-1 text-muted-foreground">{venueName}</p>
          <p className="mt-6 text-sm text-muted-foreground">
            Your 90-Day Design Prescription report is being generated. You'll receive it by email
            shortly.
          </p>
          <p className="mt-4 text-sm font-medium text-foreground">
            Calm Index: {result.calmIndex}/10
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <a
              href={process.env.NEXT_PUBLIC_CALENDLY_URL ?? "https://calendly.com/venuebydesign/60min"}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <Button className="w-full">Book your 60-min walkthrough call</Button>
            </a>
            <Link href="/dashboard" className="cursor-pointer">
              <Button variant="outline" className="w-full">
                Back to dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((domainStep * 100) / domains.length + (allAnswered ? 100 / domains.length : 0)) | 0;

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <span className="text-sm text-muted-foreground">
          Domain {domainStep + 1} of {domains.length}
        </span>
      </header>

      <div className="mx-auto w-full max-w-[375px] flex-1">
        <div className="mb-4 h-1.5 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-primary">
            {DOMAIN_LABELS[domain]}
          </p>
          <h2 className="mt-2 text-xl font-serif text-foreground leading-snug">
            {questions.length} questions about {DOMAIN_LABELS[domain].toLowerCase()}
          </h2>

          <div className="mt-6 space-y-4">
            {questions.map((q) => (
              <div key={q.id}>
                <p className="text-sm font-medium text-foreground">{q.question}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SCORE_LABELS.map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleScore(q.id, i)}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-xs transition-colors duration-200 ${
                        responses[q.id] === i
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40"
                      }`}
                      data-testid={`diagnostic-score-${q.id}-${i}`}
                    >
                      {i}: {label.split("—")[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            {domainStep > 0 && (
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
              disabled={!allAnswered || loading}
              className="flex-1 disabled:opacity-50"
              data-testid="diagnostic-next-btn"
            >
              {loading ? "Submitting…" : isLastDomain ? "Submit" : "Next domain"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
