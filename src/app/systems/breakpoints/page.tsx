import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { listAllBreakpoints } from "@/lib/systems/breakpoints";
import { requireSystemsContext } from "@/lib/systems/venue-context";
import { BreakpointsForm, type BreakpointRow } from "./breakpoints-form";
import type { Domain } from "@/lib/checkin-questions";

export default async function BreakpointsPage() {
  const { venueId } = await requireSystemsContext("/systems/breakpoints");
  const rows = await listAllBreakpoints(venueId);

  const initial: BreakpointRow[] = rows.map((r) => ({
    id: r.id,
    description: r.description,
    trigger: r.trigger,
    domain: r.domain as Domain | null,
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
  }));

  return (
    <AppShell title="Venue by Design">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/systems" className="text-xs text-muted-foreground hover:text-foreground">
          Back to Systems
        </Link>

        <div className="mt-4 border-l-[3px] border-primary bg-card p-6">
          <p className="vbd-section-label">Your fragility map</p>
          <h1 className="mt-2 font-serif text-2xl text-foreground">
            Where your venue reliably breaks
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Every venue has a handful of recurring breakpoints, the specific moments when one small
            thing reliably cascades into a bad night. Most operators know these in their bones and
            have never written them down, which means they rediscover each of them, at full cost,
            every time.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Three to five is plenty. You are looking for the repeat offenders, not every bad night
            you have ever had. A breakpoint named is a breakpoint you can design around.
          </p>
        </div>

        <BreakpointsForm venueId={venueId} initial={initial} />
      </main>
    </AppShell>
  );
}
