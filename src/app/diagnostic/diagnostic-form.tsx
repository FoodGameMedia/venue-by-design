"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getQuestionsByDomain } from "@/lib/diagnostic-questions";
import { DOMAIN_LABELS, DOMAIN_DEFINITIONS, getGroupForDomain } from "@/lib/domains";
import type { DiagnosticReport } from "@/lib/diagnostic-report";

/** Display order for the four options: designed first, failing last. */
const OPTION_ORDER = [3, 2, 1, 0] as const;

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
  const [result, setResult] = useState<{
    calmIndex: number;
    diagnosticId: string;
    report?: DiagnosticReport;
  } | null>(null);

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
      setResult({ calmIndex: data.calmIndex ?? 0, diagnosticId: data.id, report: data.report });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const report = result.report;
    return (
      <div className="flex min-h-screen flex-col items-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[375px] space-y-4" data-testid="diagnostic-report">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-serif text-foreground">90-Day Design Prescription</h1>
            <p className="mt-1 text-muted-foreground">{venueName}</p>
            <p className="mt-4 text-sm font-medium text-foreground" data-testid="diagnostic-calm-index">
              Calm Index: {result.calmIndex}/10
            </p>
            {report?.calm_index_interpretation && (
              <p className="mt-2 text-sm text-muted-foreground">{report.calm_index_interpretation}</p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              A PDF copy has been emailed to you and saved to your account.
            </p>
          </div>

          {report ? (
            <>
              <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-xs uppercase tracking-wider text-primary">Executive summary</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                  {report.executive_summary}
                </p>
              </section>

              {report.top_priorities?.length > 0 && (
                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-xs uppercase tracking-wider text-primary">Top priorities</h2>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-foreground">
                    {report.top_priorities.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ol>
                </section>
              )}

              {report.domain_insights?.length > 0 && (
                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-xs uppercase tracking-wider text-primary">Domain insights</h2>
                  <div className="mt-3 space-y-4">
                    {report.domain_insights.map((d) => (
                      <div key={d.domain} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                        <div className="flex items-baseline justify-between">
                          <p className="text-sm font-medium text-foreground">{d.label}</p>
                          <span className="text-xs text-muted-foreground">{Number(d.score).toFixed(1)}/3</span>
                        </div>
                        {d.strengths?.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Strengths: </span>
                            {d.strengths.join("; ")}
                          </p>
                        )}
                        {d.improvements?.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Improve: </span>
                            {d.improvements.join("; ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {report.ninety_day_prescription && (
                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-xs uppercase tracking-wider text-primary">90-day plan</h2>
                  <div className="mt-3 space-y-4">
                    {(
                      [
                        ["Month 1", report.ninety_day_prescription.month_one],
                        ["Month 2", report.ninety_day_prescription.month_two],
                        ["Month 3", report.ninety_day_prescription.month_three],
                      ] as const
                    ).map(([label, m]) =>
                      m ? (
                        <div key={label}>
                          <p className="text-sm font-medium text-foreground">
                            {label}: {m.focus}
                          </p>
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                            {m.actions?.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null
                    )}
                  </div>
                </section>
              )}

              {report.watch_signals?.length > 0 && (
                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-xs uppercase tracking-wider text-primary">Watch signals</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                    {report.watch_signals.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
              Your report is being generated and will arrive by email shortly.
            </div>
          )}

          <div className="flex flex-col gap-3 pb-8">
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
        <div className="border-l-4 border-primary bg-card p-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {getGroupForDomain(domain).label}
          </p>
          <h2 className="mt-2 font-serif text-xl leading-snug text-foreground">
            {DOMAIN_LABELS[domain]}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{DOMAIN_DEFINITIONS[domain]}</p>

          <div className="mt-6 space-y-6">
            {questions.map((q) => (
              <div key={q.id}>
                <p className="text-sm font-medium text-foreground">{q.question}</p>
                <div className="mt-3 space-y-2">
                  {OPTION_ORDER.map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => handleScore(q.id, score)}
                      className={`block w-full cursor-pointer border px-3 py-2 text-left text-sm transition-colors duration-200 ${
                        responses[q.id] === score
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                      data-testid={`diagnostic-score-${q.id}-${score}`}
                    >
                      {q.options[score]}
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
