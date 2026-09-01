import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { VerdictChip } from "@/components/systems/verdict-chip";
import { DOMAIN_LABELS } from "@/lib/domains";
import {
  METHOD_QUESTIONS,
  VERDICT_DESCRIPTIONS,
  type MethodQuestionResult,
  type ProcedureVerdict,
} from "@/lib/systems/method-questions";
import { fragilityHeadline } from "@/lib/systems/fragility";
import { getProcedureDetail, loadFragilityProfile } from "@/lib/systems/procedures";
import { requireSystemsContext } from "@/lib/systems/venue-context";
import { ProcedureActions } from "./procedure-actions";

function HabitField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-t border-border/60 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">
        {value ?? <span className="text-muted-foreground">Not named in the source.</span>}
      </p>
    </div>
  );
}

export default async function ProcedurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { venueId } = await requireSystemsContext(`/systems/${id}`);

  const detail = await getProcedureDetail(id, venueId);
  if (!detail) notFound();

  const { procedure, version, audit, breakpoint } = detail;
  const profile = await loadFragilityProfile(venueId);
  const results = (audit?.questionResults ?? []) as MethodQuestionResult[];
  const routine = (procedure.routine ?? []) as string[];

  return (
    <AppShell title="Venue by Design">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/systems" className="text-xs text-muted-foreground hover:text-foreground">
          Back to Systems
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl text-foreground">{procedure.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {procedure.domain ? DOMAIN_LABELS[procedure.domain] : "No domain yet"}
              {" · "}
              {procedure.status === "installed"
                ? "Installed"
                : procedure.status === "live"
                  ? "Live, unproven"
                  : "Draft"}
            </p>
          </div>
          <VerdictChip verdict={(audit?.verdict as ProcedureVerdict) ?? null} />
        </div>

        {audit ? (
          <>
            <div className="mt-6 border-l-[3px] border-primary bg-card p-6">
              <p className="font-serif text-lg text-foreground">{audit.summary}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {VERDICT_DESCRIPTIONS[audit.verdict as ProcedureVerdict]}
              </p>
              {audit.rewriteNotes && (
                <p className="mt-3 text-sm leading-relaxed text-champagne">
                  {audit.rewriteNotes}
                </p>
              )}
            </div>

            <section className="mt-8">
              <p className="vbd-section-label">The three questions</p>
              <ol className="mt-3 space-y-4" data-testid="method-question-results">
                {METHOD_QUESTIONS.map((question) => {
                  const result = results.find((r) => r.id === question.id);
                  const passed = result?.pass === true;
                  return (
                    <li key={question.id} className="vbd-elevated-card p-5">
                      <div className="flex items-start gap-3">
                        <span
                          className={
                            passed
                              ? "mt-0.5 shrink-0 text-sm font-medium text-primary"
                              : "mt-0.5 shrink-0 text-sm font-medium text-muted-foreground"
                          }
                        >
                          {passed ? "Yes" : "No"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm leading-relaxed text-foreground">
                            {question.question}
                          </p>
                          {result?.rationale && (
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                              {result.rationale}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="mt-8">
              <p className="vbd-section-label">Judged against</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {fragilityHeadline(profile)}
              </p>
              {breakpoint && (
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  Covers: {breakpoint.description}. Trigger: {breakpoint.trigger}.
                </p>
              )}
            </section>
          </>
        ) : (
          <div className="mt-6 border-l-[3px] border-champagne bg-card p-6">
            <p className="font-serif text-lg text-foreground">Not audited yet</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Run the audit and we will judge it against the three questions, using your
              breakpoints and Calm Index as the lens.
            </p>
          </div>
        )}

        <section className="mt-8">
          <p className="vbd-section-label">As a default</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Cue, routine, reinforcement and owner. Blanks are not an oversight, they are what the
            source did not say.
          </p>
          <div className="mt-3">
            <HabitField label="The default it installs" value={procedure.theDefault} />
            <HabitField label="Cue" value={procedure.cue} />
            <div className="border-t border-border/60 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Routine</p>
              {routine.length > 0 ? (
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  {routine.map((step, index) => (
                    <li key={index} className="text-sm leading-relaxed text-foreground">
                      {step}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No steps found in the source.</p>
              )}
            </div>
            <HabitField label="Reinforcement" value={procedure.reinforcement} />
            <HabitField label="Owner" value={procedure.ownerRole} />
            <HabitField label="Review cadence" value={procedure.reviewCadence} />
          </div>
        </section>

        <ProcedureActions
          venueId={venueId}
          procedureId={procedure.id}
          audited={Boolean(audit)}
          status={procedure.status}
        />

        {version && (
          <details className="mt-8">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              What we read from your source
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
              {version.body}
            </pre>
          </details>
        )}
      </main>
    </AppShell>
  );
}
