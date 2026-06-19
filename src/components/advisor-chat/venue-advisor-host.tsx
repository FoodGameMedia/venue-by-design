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

  useEffect(() => {
    if (isPublicPath(pathname) || pathname.startsWith("/advisor")) {
      setVenue(null);
      return;
    }

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
  }, [pathname]);

  if (!venue) return null;

  return (
    <VenueAdvisorPanel
      venueId={venue.id}
      venueName={venue.name}
      showDiscoveryHint={pathname === "/dashboard"}
    />
  );
}
