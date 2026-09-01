# Systems Module, Decisions Record

**Version:** 1.1
**Started:** 25 August 2026, 08:05 AEST
**This version:** 25 August 2026, 08:54 AEST
**Supersedes:** `SystemsModule_DecisionsRecord_v1_0_202608250805.md`
**Authority:** This record plus the Systems Module build specification, July 2026. The spec is the product authority; this record tracks build decisions made after it. Nothing here is re-opened without an explicit unlock from Julian.

## Changelog

- **v1.1 (25 Aug 2026, 08:54 AEST):** Spec received in full. O2 closed by repo survey. D5, D9 and D10 settled on Julian's approval. Record moved into the repo at `claude/`.
- **v1.0 (25 Aug 2026, 08:05 AEST):** Initial record. D1 to D4 settled, O1 and O2 open.

## Settled decisions

| # | Date | Decision | Reason / notes |
|---|------|----------|----------------|
| D1 | 2026-08-25 | Build sequence follows the spec: **Stage 1 MVP, audit-first**. Ingest (documents and photographs), classification, verdict screen, keep / rewrite / retire queue, PDF pack and copy-ready text export. All Systems tables laid down in the first migration even though only the audit flow uses them at MVP. | Julian confirmed the spec's own sequence, full Stage 1 including photo ingest. |
| D2 | 2026-08-25 | **Plan gating deferred.** `/systems` ships behind login but ungated by plan. Entitlement checks are added before launch. | Julian chose "decide later". Open decision O1 below. |
| D3 | 2026-08-25 | Build happens **in the repo on Julian's Mac via the Claude desktop app and connected folder** (`/Users/julianblok/Desktop/venue-by-design`). Julian runs installs, migrations and the test suite locally where the bridge cannot. | Julian's choice over a cloud clone. Confirmed necessary: the sandbox is linux-arm64 and `node_modules` holds darwin-arm64 binaries, so vitest and drizzle-kit cannot run there against the repo. |
| D4 | 2026-08-25 | Working standard applies: structure and plan approved before code; no commits or pushes unless asked; verification (tests, typecheck, build) before any handoff. | Standing instruction. |
| D5 | 2026-08-25 | **`ANTHROPIC_MODELS.sonnet` audits a procedure.** Opus stays reserved for the deep diagnostic. | The audit runs per procedure and often, and the task is classification against three fixed questions rather than synthesis. Approved by Julian. |
| D6 | 2026-08-25 | **Ingest routes.** Word `.docx` via `mammoth` (the one new runtime dependency). PDF passed to Claude as a native document content block, which handles scanned binders with no OCR stack. Photographs (JPG, PNG, WebP) as image content blocks, up to five per procedure. Describe-a-shift as free text prompted by the chapter 05 fragility questions. | Confirmed by the spec's own wording: vision for photographs, text extraction for documents. The spec's fourth input, reading checklists from a connected enforcement tool, has no integration to read from and is out of Stage 1 by the spec's own roadmap. |
| D7 | 2026-08-25 | Superseded by D9. | Raised in build plan v1.0 as an optional extra; the spec makes it mandatory. |
| D8 | 2026-08-25 | **Export covers the selected set**, with a select-all, not the whole queue automatically. | Answered by the queue design in the spec. |
| D9 | 2026-08-25 | **Add a `breakpoints` table and capture flow**, departing from the spec's four-table *Added* list. Three to five entries per venue, each a breakpoint and its trigger, one line each, per The Calm Venue ch.05. Derived signal from `domain_scores`, `diagnostics.responses` and the latest `checkins` rides alongside as context, not as a substitute. | **The spec lists the fragility map under *Reused*, but it does not exist in the app.** Method question 2 turns on it, the Breakpoint field is defined as a link to a fragility-map entry, and the "breakpoints with no procedure" line of the verdict cannot be produced without it. That line is a quarter of the screen the spec calls the demonstrable hook. Recorded as a deliberate departure from the spec, not drift. Approved by Julian. |
| D10 | 2026-08-25 | **`procedure_audits` is a separate table from `procedure_validations`.** Audits hold the three question results and the verdict; validations hold only the rostered-off record. | The spec defines validations as the rostered-off record, which is the module's signature feature. Overloading that table to save one migration blurs it. Approved by Julian. |
| D11 | 2026-08-25 | **Status and verdict are separate axes.** `procedure_status` is `draft`, `live`, `installed`. `procedure_verdict` is `keep`, `rewrite`, `retire`. An audited procedure carries a verdict immediately and stays `draft` until the operator puts it into use; only a rostered-off validation moves it to `installed`. | Corrects an error in build plan v1.0, which conflated the two. Fixed by the spec. |
| D12 | 2026-08-25 | **The decisions record and the build plans live in the repo at `claude/`.** | The record previously existed only in project storage, leaving the build with no authority file on disk. Approved by Julian. |

## Open decisions

| # | Raised | Question | Blocking? |
|---|--------|----------|-----------|
| O1 | 2026-08-25 | Which plans include the Systems module (Essentials, Pro, Group, Diagnostic purchasers)? | Not blocking build; **blocks launch**. |
| O2 | 2026-08-25 | ~~Does a fragility map exist as data in the app today?~~ **Closed 25 Aug 2026.** It does not. No table, no column, no derived helper. The word appears only as the score label for `[1]` on the 0 to 3 scale, as the Calm band *Functional but Fragile*, as check-in option copy, and in ch.05 of the manuscript. Resolved by D9. | Closed. |

## Repo notes worth keeping

- **Migration 0006 was hand-written** (`drizzle/0006_book_chunks.sql`, applied via `scripts/apply-book-chunks-migration.ts`) and produced no Drizzle snapshot, so the snapshot chain stopped at 0005. Migration 0007 therefore re-emitted `book_chunks`. Those statements were made `IF NOT EXISTS` so 0007 is safe against both production and a fresh database, and the 0007 snapshot now includes `book_chunks`, which puts the chain back in order.
- **No RLS anywhere.** Ownership is enforced in the route: session via `createClient()`, data via `createAdminClient()`, then a check against `venues.user_id`. Systems endpoints follow the same pattern.
- **DM Serif Display and DM Sans** are already wired in `layout.tsx` as `--font-serif` and `--font-sans`; charcoal and champagne tokens are in `globals.css`. The module needs no new design tokens.

## Context

- Spec received 25 Aug 2026 (document dated July 2026). Repo verified same day: `develop` @ `0c60be8`, clean, in sync, production live and matching.
- Unrelated open ops items, not part of this build: live Stripe beta promo verification; logo pick; dormant homepage hydration error.
