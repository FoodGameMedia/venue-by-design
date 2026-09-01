import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SystemsExplainer } from "@/components/page-explainer";
import { VerdictChip } from "@/components/systems/verdict-chip";
import { DOMAIN_LABELS } from "@/lib/domains";
import { listBreakpoints } from "@/lib/systems/breakpoints";
import { getAuditSummary, listProcedures } from "@/lib/systems/procedures";
import { requireSystemsContext } from "@/lib/systems/venue-context";

export default async function SystemsPage() {
  const { venueId } = await requireSystemsContext("/systems");

  const [procedures, breakpoints, summary] = await Promise.all([
    listProcedures(venueId),
    listBreakpoints(venueId),
    getAuditSummary(venueId),
  ]);

  const liveCount = procedures.filter((p) => p.status !== "draft").length;

  return (
    <AppShell title="Venue by Design">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <SystemsExplainer />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="vbd-section-label">Your set</p>
            <h2 className="mt-1 font-serif text-2xl text-foreground">
              {procedures.length === 0
                ? "Nothing audited yet"
                : `${procedures.length} procedure${procedures.length === 1 ? "" : "s"}, ${liveCount} in use`}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/systems/breakpoints" className="vbd-cta vbd-cta-lg vbd-cta-outline">
              Your breakpoints ({breakpoints.length})
            </Link>
            <Link href="/systems/new" className="vbd-cta vbd-cta-lg vbd-cta-primary">
              Audit what you have
            </Link>
          </div>
        </div>

        {procedures.length > 0 && (
          <Link
            href="/systems/audit"
            className="vbd-elevated-card vbd-elevated-card-interactive mt-6 block p-6"
          >
            <p className="vbd-section-label-accent">The verdict</p>
            <div className="mt-3 space-y-1">
              {summary.lines.map((line, index) => (
                <p
                  key={index}
                  className={
                    index === 0
                      ? "font-serif text-lg text-foreground"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {line}
                </p>
              ))}
            </div>
            {summary.unaudited > 0 && (
              <p className="mt-3 text-sm text-champagne">
                {summary.unaudited} not audited yet.
              </p>
            )}
          </Link>
        )}

        <div className="mt-8 space-y-3">
          {procedures.length === 0 ? (
            <div className="border-l-[3px] border-primary bg-card p-6">
              <p className="font-serif text-lg text-foreground">
                Start with what is already on the wall
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Upload the procedures you have, as a document, a PDF, or a photo of the binder.
                We will tell you which few are load-bearing and which you can retire today. If
                nothing is written down, describe how a normal shift runs and we will start there.
              </p>
              <Link href="/systems/new" className="vbd-cta vbd-cta-lg vbd-cta-primary mt-4 inline-flex">
                Add your first procedure
              </Link>
            </div>
          ) : (
            procedures.map((procedure) => (
              <Link
                key={procedure.id}
                href={`/systems/${procedure.id}`}
                className="vbd-elevated-card vbd-elevated-card-interactive block p-5"
                data-testid="systems-procedure-row"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-base text-foreground">{procedure.title}</p>
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
                  <VerdictChip verdict={procedure.verdict} />
                </div>
                {procedure.summary && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {procedure.summary}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      </main>
    </AppShell>
  );
}
