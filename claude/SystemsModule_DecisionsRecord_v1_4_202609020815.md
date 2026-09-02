# Systems Module, Decisions Record

**Version:** 1.4
**Started:** 25 August 2026, 08:05 AEST
**This version:** 2 September 2026, 08:15 AEST
**Supersedes:** `SystemsModule_DecisionsRecord_v1_3_202609012328.md`
**Authority:** This record plus the Systems Module build specification, July 2026. Nothing here is re-opened without an explicit unlock from Julian.

## Changelog

- **v1.4 (2 Sep 2026, 08:15 AEST):** SOP catalogue approved and shipped, commit `a939b38`, deploy Published in 56s and live-verified. O6 closed. O4 narrowed to three named targets. D22 and D23 recorded. Six defects found in the production walk, all fixed before the push. Production incident of 1 September closed.
- **v1.3 (1 Sep 2026, 23:28 AEST):** Shipped to production, commits `e996314` and `a2906d1`. Production 500 traced to a wrong database password in Netlify, not to this build. D19 and D20 recorded. SOP catalogue drafted at v0.1. O6 opened.
- **v1.2 (1 Sep 2026, 15:41 AEST):** S1 to S5 built and verified locally. D13 to D18 recorded.
- **v1.1 (25 Aug 2026, 08:54 AEST):** O2 closed. D5, D9, D10 settled. Record moved into the repo.
- **v1.0 (25 Aug 2026, 08:05 AEST):** D1 to D4 settled.

## Settled decisions

D1 to D21 as recorded in v1.3 and unchanged. New since:

| # | Date | Decision | Reason / notes |
|---|------|----------|----------------|
| D22 | 2026-09-02 | **"Other" is a venue type.** Added to `venue_type` alongside the five trading types and `hotel_fb`. An operator who picks it gets the full catalogue in its default order and all seventeen outside-remit headings. | Julian, 1 Sep: someone may not classify as any of the five, and forcing a wrong pick corrupts the ordering and the obligation filter. **Unset and "other" are now different answers.** Unset means we have not asked, so we show only the fifteen universal obligations. "Other" means none of ours fit, so we show all seventeen and let them decide. `ALTER TYPE ADD VALUE` is not reversible in Postgres, so this is a one-way door and was taken deliberately. |
| D23 | 2026-09-02 | **Catalogue approved at nineteen items, with the bookends leading for everyone.** Nineteen core moments, plus A22 promoted out of the list to become the catalogue's leading statement. The welcome and the ending lead for every venue regardless of Calm Index; the venue-type lead and the two weakest domains follow. | Julian, 1 Sep: "Endings is a key in the book and all need them as well as the welcome." A7 cut, A11 rolled into A13, A21 cut, A14 kept but loose. A22 is the book's thesis and reads as a promise rather than a task, so it heads the page rather than sitting inside operational memory. |

## Open decisions

| # | Raised | Question | Blocking? |
|---|--------|----------|-----------|
| O1 | 2026-08-25 | Which plans include the Systems module? | Not blocking build; **blocks launch**. |
| O3 | 2026-09-01 | Baseline drizzle's migration history. `npm run db:migrate` still cannot run on this database; every migration is applied by `scripts/apply-migration.ts` instead. | Compounds with every migration. |
| O4 | 2026-09-01 | **Narrowed.** Generic and Restoke are shipped, Restoke's labels read from its live documentation. Jolt, Trail and Xenia are removed until their field names are read first hand. | Not blocking. Those three return only when verified. |
| O5 | 2026-09-01 | Page and shell work, parked: rails, the explainer eating the fold, nav missing on `/score` and `/diagnostic`, the "Ask draws on your scores" naming defect, advisor versus Ask in the internals, and a public home page naming the method. | Parked at Julian's instruction. |
| O7 | 2026-09-02 | `catalogue-generate.ts` has no unit tests. Every other module in `src/lib/systems/` does. | Not blocking. Verified by hand end to end on production. |

## Defects found in the production walk, 2 September

All six were found by walking the live catalogue, and all six were fixed before the push.

1. **The bookends did not lead on screen.** The ordering ranked them first but the page rendered by group, so the welcome and the ending appeared wherever their domain fell. A "Start here" section now renders every item with a stated reason, in rank order, and the groups below exclude what it has already shown.
2. **Promotion duplicated breakpoints.** Ticking a second item as not working created a second breakpoint describing the same bad night, and burned a slot against the ceiling of five. The interview now offers the breakpoints already named and links to one instead of creating another.
3. **The audit renamed generated procedures.** A procedure written from the catalogue came back from the audit with the model's own title and domain, and lost its link to the breakpoint that caused it. The audit now keeps the title, domain and breakpoint of anything whose provenance is `generated`.
4. **Unset and "other" showed the same obligations.** Covered by D22.
5. **Generated procedures read as if we had found them.** The habit panel said blanks were "what the source did not say" for a procedure we had just written from the operator's own answers. Generated procedures now say so and invite the edit.
6. **"Other" did not exist.** Covered by D22.

## Production incident, 1 September 2026: closed

Resolved. The `DATABASE_URL` password in Netlify was corrected by Julian and the redeploy Published. `/systems`, `/diagnostic` and every other Drizzle-backed page render on production. The Deep Diagnostic, a paid product that had been failing for an unknown period, is working again.

The wrong call recorded in v1.3 stands as recorded: the first diagnosis blamed a direct-connection URL without testing it, when the function log settled it in one read.

## Build state at v1.4

**Live on production**, commit `a939b38`, deploy Published in 56s.

**Verified on production, by walking it:**

- `/systems/catalogue` renders the nineteen items, the leading statement, the "Start here" section with the two bookends and five weak-domain items, and the fifteen universal obligations. No console errors.
- `/systems` renders the verdict, both procedures, and their audits. No console errors.
- The catalogue-generated procedure kept its own title, "Write handover book at 3:55pm daily", through the audit, and came back load-bearing on all three method questions.

**Verified locally:** full gate green before the push. Migration `0009_venue_type_other.sql` applied to the live database.

**Schema at v1.4:** eight Systems tables (`breakpoints`, `procedures`, `procedure_versions`, `procedure_audits`, `procedure_validations`, `procedure_exports`, `catalogue_selections`, `venue_obligations`), migrations `0007` through `0009`.
