import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SystemsExplainer } from "@/components/page-explainer";
import { VerdictChip } from "@/components/systems/verdict-chip";
import { DOMAIN_LABELS } from "@/lib/domains";
import { listBreakpoints } from "@/lib/systems/breakpoints";
import { getAuditSummary, listProcedures } from "@/lib/systems/procedures";
import { requireSystemsContext } from "@/lib/systems/venue-context";

export default async function SystemsPage() {
  const { venueId, carries } = await requireSystemsContext("/systems");
  const canAudit = carries("audit");

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
            {canAudit ? (
              <Link href="/systems/new" className="vbd-cta vbd-cta-lg vbd-cta-primary">
                Audit what you have
              </Link>
            ) : (
              <Link href="/systems/catalogue" className="vbd-cta vbd-cta-lg vbd-cta-primary">
                Build your starting set
              </Link>
            )}
          </div>
        </div>

        {!canAudit && (
          <div className="mt-6 border-l-[3px] border-champagne bg-card p-5">
            <p className="text-sm leading-relaxed text-foreground">
              Already have procedures written down?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Auditing a binder you already keep, and getting a keep, rewrite or retire verdict on
              every page of it, is part of Venue Pulse Pro. Essentials writes you a starting set
              from the catalogue.
            </p>
            <Link
              href="/pricing?systems=audit"
              className="vbd-cta vbd-cta-lg vbd-cta-outline mt-4 inline-flex"
            >
              See Pro
            </Link>
          </div>
        )}

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
                If nothing is written down, start from the moments every venue has to get right
                and we will write the defaults with you. If you already have procedures, bring
                them in and we will tell you which few are load-bearing and which you can retire
                today.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/systems/catalogue" className="vbd-cta vbd-cta-lg vbd-cta-primary">
                  Start from the moments
                </Link>
                <Link href="/systems/new" className="vbd-cta vbd-cta-lg vbd-cta-outline">
                  I have procedures already
                </Link>
              </div>
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
