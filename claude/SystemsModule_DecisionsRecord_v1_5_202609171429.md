# Systems Module, Decisions Record

**Version:** 1.5
**Started:** 25 August 2026, 08:05 AEST
**This version:** 17 September 2026, 14:29 AEST
**Supersedes:** `SystemsModule_DecisionsRecord_v1_4_202609171030.md`
**Authority:** This record plus the Systems Module build specification, July 2026. Nothing here is re-opened without an explicit unlock from Julian.

## Changelog

- **v1.5 (17 Sep 2026, 14:29 AEST):** O1 closed after three weeks blocking launch: Systems splits across Venue Pulse tiers. D24 to D28 recorded. The O5 shell and flow work built. A date fault corrected, see below.
- **v1.4 (17 Sep 2026, 10:30 AEST):** SOP catalogue approved and shipped, commit `a939b38`. O6 closed, O4 narrowed. D22 and D23 recorded. Six defects found in the production walk, all fixed before the push.
- **v1.3 (1 Sep 2026, 23:28 AEST):** Shipped to production. D19 and D20 recorded. SOP catalogue drafted at v0.1. O6 opened.
- **v1.2 (1 Sep 2026, 15:41 AEST):** S1 to S5 built and verified locally. D13 to D18 recorded.
- **v1.1 (25 Aug 2026, 08:54 AEST):** O2 closed. D5, D9, D10 settled.
- **v1.0 (25 Aug 2026, 08:05 AEST):** D1 to D4 settled.

## A correction on dates

v1.4 was issued as `SystemsModule_DecisionsRecord_v1_4_202609020815.md` and dated 2 September. Both were wrong. It has been renamed to `_202609171030` and its internal dates corrected to 17 September.

**Why it happened.** The machine's `git` stamps commits made on 17 September as `2026-09-02`, and Netlify, reading the same clock through the browser, rendered those commits as "Today". Two independent-looking signals agreed on the wrong date, so it was taken rather than checked. The standing instruction is to check the date in real time rather than infer it, and it was not followed.

**What it affects.** Every commit in this repository carries a date roughly fifteen days behind the real one, `e996314` onward at least. The commit contents and order are correct; only the timestamps are wrong. **This is not fixed** and will keep happening until the machine clock is corrected. Recorded here so that nobody later reads the git history as a timeline.

## Settled decisions

D1 to D23 as recorded in v1.4 and unchanged. New since:

| # | Date | Decision | Reason / notes |
|---|------|----------|----------------|
| D24 | 2026-09-17 | **Systems splits across the Venue Pulse tiers rather than sitting in one.** The catalogue, the interview and naming breakpoints are carried from **Essentials** up. Uploading a binder, running an audit and re-auditing are carried from **Pro** up. Group carries everything Pro does. | **Closes O1.** The two halves answer different questions for different operators. The catalogue is how a venue with no procedures gets on its feet, and that operator is the least likely to be paying $99 in their first month, so putting it behind Pro would have locked the primary use case out at the front door. The audit judges a binder that already exists, which means an operator further along, and it is the expensive half: every upload is parsed, retrieved against the books and sent to the model. It also gives Pro a second reason to exist, which it needed. |
| D25 | 2026-09-17 | **Entitlement fails closed.** A database fault resolving the plan returns `free`, not the last known plan and not a permissive default. | A gate that opens when it cannot see is not a gate. The cost of a wrongly refused audit is one support message; the cost of the reverse is unbounded model spend. |
| D26 | 2026-09-17 | **`past_due` keeps working**, alongside `trialing` and `active`. Nothing else does. | Stripe retries a failed card for days. Locking an operator out over a card that will succeed on the second attempt costs more goodwill than the generations it saves. **Julian to confirm or overturn.** |
| D27 | 2026-09-17 | **Ownership is checked before plan, always.** A venue that is not yours returns 404 whatever you pay, and no response ever reveals that a higher plan would have granted access. | Otherwise the 403 becomes an oracle for the existence of other people's venues. |
| D28 | 2026-09-17 | **The in-app chat is named Sebastian.** One name across the panel, the hint, the placeholder, the error copy, the aria-labels, the check-in explainer, the four page explainers, the privacy page and the terms page. `advisor` now means only the consultant portal at `/advisor`. | Julian, 17 Sep. It had been three names at once, Ask, Venue advisor and Ask your venue advisor, while `advisor` separately meant a different product. The hint read "Ask draws on your scores", which parses as an instruction to ask a person named Draws. |

## Open decisions

| # | Raised | Question | Blocking? |
|---|--------|----------|-----------|
| O3 | 2026-09-01 | Baseline drizzle's migration history. `npm run db:migrate` still cannot run; every migration goes through `scripts/apply-migration.ts`. | Compounds with every migration. |
| O4 | 2026-09-01 | Jolt, Trail and Xenia export labels need first-hand verification before those targets return. Generic and Restoke are shipped. | Not blocking. |
| O7 | 2026-09-17 | `catalogue-generate.ts` has no unit tests. | Not blocking. Verified by hand end to end on production. |
| O8 | 2026-09-17 | **Who loses Systems when D24 deploys.** The module has been open to every signed-in user since it shipped. `scripts/check-systems-entitlement-impact.ts` counts the operators with a venue and no live plan. **Run it before pushing D24** and decide what those operators get. | **Blocks the D24 deploy.** |
| O9 | 2026-09-17 | **The machine clock is wrong**, see the correction above. Until it is fixed every commit is misdated. | Not blocking work. Corrupts the history. |
| O10 | 2026-09-17 | **The band names collide across two scales.** The Food Game Diagnostic Test scores out of 21 and bands it Structural Risk 0 to 10, Functional but Fragile 11 to 16, Designed for Calm 17 to 21. Venue by Design scores out of 10 and uses the same three names at 0 to 4, 5 to 7, 8 to 10. A prospect scoring 8 is told Structural Risk on one site and Designed for Calm on the other, inside one funnel. The `/10` version is the Calm Index as the book defines it. | **Blocks nothing technically, damages the funnel now.** Food Game Media's side to change. |
| O11 | 2026-09-17 | Phone width on the authenticated pages is unverified. `resize_window` reports success but the viewport does not change, and the in-app browser has no session. Ten seconds in Chrome DevTools settles it. | Not blocking. |

O1, O2, O5 and O6 are closed.

## O5, closed: the shell and flow work

Parked on 1 September, built 17 September.

**The white space was a missing measure, not a missing rail.** Every signed-in page was `w-full` with padding only, and there was no max-width anywhere in the app nor any container class in `globals.css`. On a wide monitor a line of body text ran close to nineteen hundred pixels, roughly four times a readable line. `PageContainer` caps it. The dashboard gains a single right rail carrying the check-in history and the domains radar, so the main column holds only the weekly loop: the number, the trend, the one change and the re-score. The two-up grid at the bottom is gone.

**Four pages built their own shell, not two.** `/score` re-exports `/checkin`, and neither used `AppShell`. `/diagnostic` rendered a bare `div`. All three now sit in `AppShell` and are no longer dead ends. `/advisor` keeps its own header deliberately: an external consultant has no use for This Week, Score, Domains or Systems. Four `min-h-screen` roots inside those forms became `flex-1`, or every page would have been a viewport taller than the screen.

**The explainer ate the fold because it was unconditional.** Four long paragraphs above every number, every visit, forever. It now keeps its label and heading always visible and collapses the body behind a "Why this page" toggle, open on the first visit and closed from the moment it is first dismissed, per page and per browser.

**A bug found by walking it.** The dashboard domains radar was gated on `trendData.length > 0`. The trend holds eight weeks. So any operator who had not checked in for two months lost the whole seven-domain picture at exactly the moment they most needed it. It is now gated on the domain scores it is actually built from, and both that card and the trend card say why they are empty rather than rendering a heading with nothing under it.

**The public page.** A new section, "The backbone", names *The Food Game* as the diagnosis and *The Calm Venue* as the method, which the page had never done. Systems appears in the weekly loop and as a third card in "What you get".

## Build state at v1.5

**Live on production:** commit `325f5e1`, everything through v1.4.

**Written, gated green locally, not yet pushed:** the O5 shell work, the Sebastian rename, the radar fix, the public page additions, and the D24 entitlement split.

**Verified by walking the local build:** nav on every signed-in page, the measure, the rail, the radar rendering in it without clipping, the collapsed explainers, Sebastian throughout, the new public section at both desktop and 375px with no horizontal overflow. No console errors on any route.

**Not verified:** the authenticated pages at phone width, see O11.

**Schema unchanged at v1.5.** The entitlement split reads `subscriptions.plan` and `subscriptions.status`, which already existed. No migration.
