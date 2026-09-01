/**
 * Client-safe constants for the Systems module.
 *
 * These live apart from the modules that use them because the forms are client
 * components. Importing a constant from `breakpoints.ts` or `procedure-ingest.ts`
 * drags `@/db` (and therefore `postgres`, and therefore `net`, `tls` and `fs`)
 * or the Anthropic SDK into the browser bundle. Nothing in this file imports
 * anything, so it is safe on both sides.
 */

/** The Calm Venue ch.03: three to five breakpoints is plenty. Five is the ceiling. */
export const MAX_ACTIVE_BREAKPOINTS = 5;

/** Matches the 10MB limit on the procedure-sources bucket. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** A binder page or a laminated card, not a photo album. */
export const MAX_IMAGES = 5;
