"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { VenueAdvisorPanel } from "./venue-advisor-panel";

const PUBLIC_PREFIXES = ["/login", "/pricing", "/auth/"] as const;

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

interface VenueSummary {
  id: string;
  name: string;
}

export function VenueAdvisorHost() {
  const pathname = usePathname();
  const [venue, setVenue] = useState<VenueSummary | null>(null);

  // Derived, not stored. Clearing the venue with a synchronous setState inside
  // the effect caused a cascading render on every public route.
  const hidden = isPublicPath(pathname) || pathname.startsWith("/advisor");

  useEffect(() => {
    if (hidden) return;

    let cancelled = false;

    async function loadVenue() {
      try {
        const res = await fetch("/api/venues");
        if (!res.ok) {
          if (!cancelled) setVenue(null);
          return;
        }
        const data = (await res.json()) as { venues?: VenueSummary[] };
        const first = data.venues?.[0];
        if (!cancelled) {
          setVenue(first ? { id: first.id, name: first.name } : null);
        }
      } catch {
        if (!cancelled) setVenue(null);
      }
    }

    void loadVenue();

    return () => {
      cancelled = true;
    };
  }, [pathname, hidden]);

  if (hidden || !venue) return null;

  return (
    <VenueAdvisorPanel
      venueId={venue.id}
      venueName={venue.name}
      showDiscoveryHint={pathname === "/dashboard"}
    />
  );
}
