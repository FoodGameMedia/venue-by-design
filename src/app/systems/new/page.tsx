import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { listBreakpoints } from "@/lib/systems/breakpoints";
import { requireSystemsContext } from "@/lib/systems/venue-context";
import { IngestForm } from "./ingest-form";

export default async function NewProcedurePage() {
  const { venueId } = await requireSystemsContext("/systems/new");
  const breakpoints = await listBreakpoints(venueId);

  return (
    <AppShell title="Venue by Design">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/systems" className="text-xs text-muted-foreground hover:text-foreground">
          Back to Systems
        </Link>

        <div className="mt-4">
          <p className="vbd-section-label">Add a procedure</p>
          <h1 className="mt-2 font-serif text-2xl text-foreground">
            One at a time, whatever form it is in
          </h1>
        </div>

        {breakpoints.length === 0 && (
          <div className="mt-6 border-l-[3px] border-champagne bg-card p-5">
            <p className="text-sm leading-relaxed text-foreground">
              You have not named your breakpoints yet. The audit can still run, but the second
              question, whether a procedure covers a moment you actually break on, will be judged
              on your Calm Index alone. Ten minutes on the map makes this much sharper.
            </p>
            <Link
              href="/systems/breakpoints"
              className="vbd-cta vbd-cta-lg vbd-cta-outline mt-4 inline-flex"
            >
              Name your breakpoints first
            </Link>
          </div>
        )}

        <IngestForm venueId={venueId} />
      </main>
    </AppShell>
  );
}
