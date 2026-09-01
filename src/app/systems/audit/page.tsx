import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DOMAIN_LABELS } from "@/lib/domains";
import type { ProcedureVerdict } from "@/lib/systems/method-questions";
import { getAuditSummary, listProcedures } from "@/lib/systems/procedures";
import { requireSystemsContext } from "@/lib/systems/venue-context";
import { ExportQueue, type QueueItem } from "./export-queue";

export default async function AuditVerdictPage() {
  const { venueId } = await requireSystemsContext("/systems/audit");

  const [procedures, summary] = await Promise.all([
    listProcedures(venueId),
    getAuditSummary(venueId),
  ]);

  const queueItems: QueueItem[] = procedures
    .filter((p): p is typeof p & { verdict: ProcedureVerdict } => p.verdict !== null)
    .map((p) => ({ id: p.id, title: p.title, verdict: p.verdict }));

  return (
    <AppShell title="Venue by Design">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/systems" className="text-xs text-muted-foreground hover:text-foreground">
          Back to Systems
        </Link>

        <div className="mt-4 border-l-[3px] border-primary bg-card p-6">
          <p className="vbd-section-label-accent">The verdict</p>
          <div className="mt-3 space-y-2">
            {summary.lines.map((line, index) => (
              <p
                key={index}
                className={
                  index === 0
                    ? "font-serif text-2xl text-foreground"
                    : "font-serif text-lg text-muted-foreground"
                }
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        {summary.summary.uncoveredBreakpoints.length > 0 && (
          <section className="mt-8">
            <p className="vbd-section-label">Breakpoints with no procedure</p>
            <ul className="mt-3 space-y-2" data-testid="uncovered-breakpoints">
              {summary.summary.uncoveredBreakpoints.map((b) => (
                <li key={b.id} className="border-l-[3px] border-champagne bg-card p-4">
                  <p className="font-serif text-base text-foreground">{b.description}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Trigger: {b.trigger}
                    {b.domain ? ` · ${DOMAIN_LABELS[b.domain]}` : ""}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              These are the moments you told us you break on, with nothing designed to catch them.
              They are where the next procedure should come from, not from a template library.
            </p>
          </section>
        )}

        <ExportQueue venueId={venueId} items={queueItems} />

        {summary.unaudited > 0 && (
          <p className="mt-8 text-sm text-champagne">
            {summary.unaudited} procedure{summary.unaudited === 1 ? "" : "s"} still to audit. Open
            each from the Systems list and run it.
          </p>
        )}
      </main>
    </AppShell>
  );
}
