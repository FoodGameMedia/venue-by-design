import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { CATALOGUE_LEAD } from "@/lib/systems/catalogue";
import {
  ceilingMessage,
  getCatalogueState,
} from "@/lib/systems/catalogue-selections";
import { loadFragilityProfile } from "@/lib/systems/procedures";
import { requireSystemsContext } from "@/lib/systems/venue-context";
import { VENUE_TYPES, VENUE_TYPE_LABELS, type VenueType } from "@/lib/systems/venue-types";
import {
  CatalogueForm,
  type CatalogueItemView,
  type ObligationView,
} from "./catalogue-form";

export default async function CataloguePage() {
  const { venueId } = await requireSystemsContext("/systems/catalogue");

  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, venueId),
    columns: { venueType: true },
  });

  const venueType: VenueType | null =
    venue?.venueType && (VENUE_TYPES as readonly string[]).includes(venue.venueType)
      ? (venue.venueType as VenueType)
      : null;

  const profile = await loadFragilityProfile(venueId);
  const state = await getCatalogueState(venueId, venueType, profile.weakestDomains);

  const items: CatalogueItemView[] = [
    ...state.entries.map((entry) => ({
      id: entry.item.id,
      group: entry.item.group,
      title: entry.item.title,
      domain: entry.item.domain,
      without: entry.item.without,
      optional: entry.item.optional === true,
      reason: entry.reason,
      state: entry.selection?.state ?? null,
    })),
    ...state.additions.map((addition) => ({
      id: addition.id,
      group: "addition" as const,
      title: addition.title,
      domain: addition.domain,
      without: "",
      optional: false,
      reason: null,
      state: addition.selection?.state ?? null,
    })),
  ];

  const obligations: ObligationView[] = state.obligations.map((o) => ({
    id: o.obligation.id,
    heading: o.obligation.heading,
    authority: o.obligation.authority,
    status: o.status,
  }));

  return (
    <AppShell title="Venue by Design">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/systems" className="text-xs text-muted-foreground hover:text-foreground">
          Back to Systems
        </Link>

        <div className="mt-4 border-l-[3px] border-primary bg-card p-6">
          <p className="vbd-section-label">The starting set</p>
          {CATALOGUE_LEAD.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? "mt-2 font-serif text-lg leading-relaxed text-foreground"
                  : "mt-3 text-sm leading-relaxed text-muted-foreground"
              }
            >
              {paragraph}
            </p>
          ))}
          <p className="mt-4 text-xs italic text-muted-foreground">
            {CATALOGUE_LEAD.attribution}
          </p>
        </div>

        {venueType ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Ordered for a {VENUE_TYPE_LABELS[venueType].toLowerCase()}
            {profile.weakestDomains.length > 0 && ", and for where you are weakest"}.
          </p>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            Set your venue type in onboarding and we will order this for your kind of venue.
          </p>
        )}

        <CatalogueForm
          venueId={venueId}
          items={items}
          obligations={obligations}
          ceilingMessage={ceilingMessage(state.ceilingCount)}
        />
      </main>
    </AppShell>
  );
}
