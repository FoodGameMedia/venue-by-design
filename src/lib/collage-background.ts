export const COLLAGE_URLS = {
  v1: "/backgrounds/venue-collage-loop.png",
  v2: "/backgrounds/venue-collage-loop-v2.png",
} as const;

export type CollageVariant = keyof typeof COLLAGE_URLS;

/** Public pages that always use v1 (no alternation). */
const V1_ONLY_PATHS = new Set(["/", "/pricing"]);

/**
 * Ordered routes for v1/v2 alternation starting at login (index 0 = v1).
 * Longer paths must appear before their prefixes (e.g. /advisor/onboarding before /advisor).
 */
export const ALTERNATING_ROUTES = [
  "/login",
  "/dashboard",
  "/score",
  "/domains",
  "/my-plan",
  "/checkin",
  "/diagnostic",
  "/onboarding",
  "/advisor/onboarding",
  "/advisor",
] as const;

export function getCollageVariant(pathname: string): CollageVariant {
  if (V1_ONLY_PATHS.has(pathname)) {
    return "v1";
  }

  const match = ALTERNATING_ROUTES.find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!match) {
    return "v1";
  }

  const index = ALTERNATING_ROUTES.indexOf(match);
  return index % 2 === 0 ? "v1" : "v2";
}
