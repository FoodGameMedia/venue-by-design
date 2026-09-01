# Systems Module, Decisions Record

**Version:** 1.3
**Started:** 25 August 2026, 08:05 AEST
**This version:** 1 September 2026, 23:28 AEST
**Supersedes:** `SystemsModule_DecisionsRecord_v1_2_202609011541.md`
**Authority:** This record plus the Systems Module build specification, July 2026. Nothing here is re-opened without an explicit unlock from Julian.

## Changelog

- **v1.3 (1 Sep 2026, 23:28 AEST):** Shipped to production, commits `e996314` and `a2906d1`. Deploy Published. Production 500 traced to a wrong database password in Netlify, not to this build. D19 and D20 recorded: the manual generator is unlocked with a soft ceiling, and the outside-remit headings are named-authority-only. SOP catalogue drafted at v0.1. O6 opened.
- **v1.2 (1 Sep 2026, 15:41 AEST):** S1 to S5 built and verified locally. D13 to D18 recorded.
- **v1.1 (25 Aug 2026, 08:54 AEST):** O2 closed. D5, D9, D10 settled. Record moved into the repo.
- **v1.0 (25 Aug 2026, 08:05 AEST):** D1 to D4 settled.

## Settled decisions

D1 to D18 as recorded in v1.2 and unchanged. New since:

| # | Date | Decision | Reason / notes |
|---|------|----------|----------------|
| D19 | 2026-09-01 | **The manual generator is unlocked, with a soft ceiling.** A curated catalogue drawn from the two books, self-selected by the operator, then customised by interview per item. Ticking more than four does not refuse: the module states that the minimum system set is three or four, asks which three to install first, generates the rest into the library, and starts only the chosen ones as live. | **This is a deliberate deviation from the spec**, which states "the module never mass-generates a procedure library, the refusal to bulk-produce is the product". Julian's unlock, 1 Sep. The moat is preserved by keeping the catalogue method-derived, ordering it by the venue's Calm Index, and turning "having issues with this" ticks into candidate breakpoints, so the catalogue feeds the diagnosis rather than bypassing it. |
| D20 | 2026-09-01 | **Outside-remit SOPs are headings and authorities only.** Payroll, HR, WHS, food safety, liquor, tax and the rest are listed, the operator says whether one exists, and where it does not the module names the body that sets the standard. The module never drafts the policy. These sit outside the audit, never receive a verdict, and never count toward the minimum system set. | Legal exposure. Drafting employment or safety policy is a lawyer's or accountant's job. The three method questions do not apply to a superannuation policy. |
| D21 | 2026-09-01 | **The catalogue varies by venue type**, in which items lead and at most two type-specific additions each. The seven domains do not change. | Julian, 1 Sep. Kept to two additions per type so it does not become a per-type template library. |

## Open decisions

| # | Raised | Question | Blocking? |
|---|--------|----------|-----------|
| O1 | 2026-08-25 | Which plans include the Systems module? | Not blocking build; **blocks launch**. |
| O3 | 2026-09-01 | Baseline drizzle's migration history. `npm run db:migrate` still cannot run on this database. | Compounds with every migration. |
| O4 | 2026-09-01 | Export target field names for Jolt, Trail, Xenia and Restoke were written from memory, not live documentation. Recommendation: ship generic-only until verified, starting with Restoke. | Blocks shipping named targets. |
| O5 | 2026-09-01 | Page and shell work, parked: rails, the explainer eating the fold, nav missing on `/score` and `/diagnostic`, the "Ask draws on your scores" naming defect, advisor versus Ask in the internals, and a public home page naming the method. | Parked at Julian's instruction. |
| O6 | 2026-09-01 | **SOP catalogue v0.1 awaiting approval.** Part A twenty-two core items to cut and rename, Part B venue-type leads to sanity-check, Part C stance to confirm, and whether Part C filters by venue type. See `SystemsModule_SOPCatalogue_v0_1_202609011856.md`. | **Blocks the build flow.** |

## Production incident, 1 September 2026

**Symptom.** After deploying `a2906d1`, `/systems` and `/diagnostic` both returned 500 on production. `/dashboard` and the public pages rendered normally.

**Cause.** `password authentication failed for user "postgres"`, Postgres code `28P01`, from the Netlify function log. The production `DATABASE_URL` carries the correct pooler host and port but the wrong password. Every page that reaches the database through Drizzle fails on connect. `/dashboard` is unaffected because it reads through the Supabase client with its own key.

**Not caused by this build.** `/diagnostic` predates the Systems module entirely and fails identically. The Supabase pause masked this until the project was resumed on 1 September, so the Deep Diagnostic, a paid product, has been broken on production for an unknown period.

**A wrong call worth recording.** The first diagnosis was that production held a direct-connection URL rather than the pooler. That was wrong: the host and port match local. The hypothesis came from the standing note about IPv4 and the Session Pooler and was not tested before being stated. The function log settled it in one read and should have been the first stop.

**Fix, outstanding.** Copy the working `DATABASE_URL` value from local `.env.local` into the Netlify environment variable, then trigger a clear-cache redeploy. Julian's to do: the assistant cannot handle credentials in plain text.

**Follow-up worth doing.** If the database password was rotated at some point without Netlify being updated, both places need to change together in future. Worth a line in the setup guide.

## Build state at v1.3

**Live on production**, commits `e996314` and `a2906d1`, deploy Published in 1m 17s: the whole Systems module, five screens and six endpoints, the advisor-chat and lint fixes, and two months of previously unshipped `develop` work.

**Verified on production:** deploy reached Published; homepage and pricing render with no console errors; `/systems` is behind login as D2 intends.

**Not verified on production:** every authenticated Drizzle-backed page, because of the password fault above.

**Verified locally, end to end, against the real database:** breakpoint creation, describe-a-shift ingest, a live Claude audit returning a correct on-method verdict, the verdict screen, the procedure screen, and no console errors on `/systems`, `/dashboard` or `/domains`. Gate green: 256 tests, 0 lint errors, production build compiled.
