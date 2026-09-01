import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { catalogueSelections, venues } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { DOMAIN_LABELS } from "@/lib/domains";
import { listBreakpoints } from "@/lib/systems/breakpoints";
import { subjectFor } from "@/lib/systems/catalogue-generate";
import { buildInterview } from "@/lib/systems/procedure-draft";
import { requireSystemsContext } from "@/lib/systems/venue-context";
import { VENUE_TYPES, type VenueType } from "@/lib/systems/venue-types";
import { InterviewForm, type InterviewQuestionView } from "./interview-form";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const { venueId } = await requireSystemsContext(`/systems/catalogue/${itemId}`);

  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, venueId),
    columns: { venueType: true },
  });

  const venueType: VenueType | null =
    venue?.venueType && (VENUE_TYPES as readonly string[]).includes(venue.venueType)
      ? (venue.venueType as VenueType)
      : null;

  const subject = subjectFor(itemId, venueType);
  if (!subject) notFound();

  const selection = await db.query.catalogueSelections.findFirst({
    where: and(
      eq(catalogueSelections.venueId, venueId),
      eq(catalogueSelections.itemId, itemId)
    ),
  });

  const questions: InterviewQuestionView[] = buildInterview(subject).map((q) => ({
    id: q.id,
    question: q.question,
    help: q.help,
    suggestion: q.suggestion,
    multiline: q.id === "routine",
  }));

  const needsBreakpoint = selection?.state === "not_working" && !selection.breakpointId;

  // Offered before creating a new one, so the same bad night is not named twice.
  const existingBreakpoints = needsBreakpoint
    ? (await listBreakpoints(venueId)).map((b) => ({
        id: b.id,
        description: b.description,
        trigger: b.trigger,
      }))
    : [];

  return (
    <AppShell title="Venue by Design">
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/systems/catalogue"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Back to the starting set
        </Link>

        <div className="mt-4">
          <p className="vbd-section-label">{DOMAIN_LABELS[subject.domain]}</p>
          <h1 className="mt-2 font-serif text-2xl text-foreground">{subject.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Five questions. The cue and the owner are pre-filled from the book, so if your venue
            works the way the book expects, accept them and move on. Answer in your own words
            where it differs.
          </p>
        </div>

        {selection?.procedureId && (
          <div className="mt-6 border-l-[3px] border-primary bg-card p-5">
            <p className="text-sm leading-relaxed text-foreground">
              We have already written this one.
            </p>
            <Link
              href={`/systems/${selection.procedureId}`}
              className="vbd-cta vbd-cta-lg vbd-cta-outline mt-4 inline-flex"
            >
              Open it
            </Link>
          </div>
        )}

        {!selection && (
          <div className="mt-6 border-l-[3px] border-champagne bg-card p-5">
            <p className="text-sm leading-relaxed text-foreground">
              You have not ticked this one yet. Go back and say whether you do not have it, or
              have it and it is not working. Both tell us something.
            </p>
          </div>
        )}

        {selection && !selection.procedureId && (
          <InterviewForm
            venueId={venueId}
            itemId={itemId}
            questions={questions}
            needsBreakpoint={Boolean(needsBreakpoint)}
            existingBreakpoints={existingBreakpoints}
          />
        )}
      </main>
    </AppShell>
  );
}
