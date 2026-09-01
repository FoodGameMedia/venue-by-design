# Systems Module, Decisions Record

**Version:** 1.2
**Started:** 25 August 2026, 08:05 AEST
**This version:** 1 September 2026, 15:41 AEST
**Supersedes:** `SystemsModule_DecisionsRecord_v1_1_202608250854.md`
**Authority:** This record plus the Systems Module build specification, July 2026. The spec is the product authority; this record tracks build decisions made after it. Nothing here is re-opened without an explicit unlock from Julian.

## Changelog

- **v1.2 (1 Sep 2026, 15:41 AEST):** S1 to S5 built and verified. D13 to D18 recorded. Two blockers raised: the Anthropic key has no credit, and drizzle's migration history is empty. Page and shell work parked at Julian's instruction.
- **v1.1 (25 Aug 2026, 08:54 AEST):** Spec received in full. O2 closed by repo survey. D5, D9 and D10 settled. Record moved into the repo at `claude/`.
- **v1.0 (25 Aug 2026, 08:05 AEST):** Initial record. D1 to D4 settled, O1 and O2 open.

## Settled decisions

| # | Date | Decision | Reason / notes |
|---|------|----------|----------------|
| D1 | 2026-08-25 | **Stage 1 MVP, audit-first**, per the spec's own sequence. All Systems tables in the first migration. | Julian confirmed. |
| D2 | 2026-08-25 | **Plan gating deferred.** `/systems` ships behind login, ungated by plan. | Open decision O1 below. |
| D3 | 2026-08-25 | Build in the repo on Julian's Mac via the connected folder. Julian runs installs, migrations, the test suite and the dev server. | Confirmed necessary: the sandbox is linux-arm64 and `node_modules` holds darwin-arm64 binaries, so vitest, drizzle-kit, eslint and next build cannot run there. |
| D4 | 2026-08-25 | Working standard applies: plan approved before code, no commits or pushes unless asked, full gate before any handoff. | Standing instruction. |
| D5 | 2026-08-25 | **`ANTHROPIC_MODELS.sonnet` audits a procedure.** Opus stays for the deep diagnostic. | Classification against three fixed questions, run often. Approved. |
| D6 | 2026-08-25 | **Ingest routes.** `.docx` via mammoth, PDF as a native document block, photographs as image blocks (max five), describe-a-shift as free text. | Confirmed by the spec's wording. The fourth input, reading a connected enforcement tool, has no integration and is out of Stage 1. |
| D7 | 2026-08-25 | Superseded by D9. | |
| D8 | 2026-08-25 | **Export covers the selected set**, with select-all per queue. | |
| D9 | 2026-08-25 | **`breakpoints` table added**, departing from the spec's four-table list. Three to five per venue, description and trigger, per ch.03. | The spec lists the fragility map under *Reused* but it does not exist. Method question 2 and the uncovered-breakpoints line both depend on it. Approved. |
| D10 | 2026-08-25 | **`procedure_audits` separate from `procedure_validations`.** | The spec reserves validations for the rostered-off record. Approved. |
| D11 | 2026-08-25 | **Status and verdict are separate axes.** Status: draft, live, installed. Verdict: keep, rewrite, retire. | Corrects an error in build plan v1.0. |
| D12 | 2026-08-25 | Decisions record and build plans live in the repo at `claude/`. | Approved. |
| D13 | 2026-09-01 | **The verdict rule.** Question 1 fails, or question 2 fails, and it retires. Questions 1 and 2 pass but 3 fails, and it is rewritten as a default. All three pass, keep. Retire beats rewrite when both apply. | The spec gives the three questions and four output categories but never states the mapping. Derived from its own language. Approved. |
| D14 | 2026-09-01 | **The verdict is computed in code, not read from the model.** The model returns pass or fail plus a rationale per question; `verdictFor()` decides. | Keeps the rule from drifting between calls. Covered by a test asserting a model claiming "keep" on a failed question 1 still retires. |
| D15 | 2026-09-01 | **A retiring procedure does not cover a breakpoint.** | It is about to be gone, so it cannot count toward coverage on the verdict screen. |
| D16 | 2026-09-01 | **Five open breakpoints is a hard ceiling.** The sixth is refused with a message to design one out first. | Ch.03 says three to five is plenty. A fragility map that swells stops being a map. |
| D17 | 2026-09-01 | **`installed` is refused by the PATCH endpoint.** Reachable only through a rostered-off validation at v1.1. | The gate is in the software from day one rather than retrofitted. |
| D18 | 2026-09-01 | **Systems migrations apply via a per-migration script** (`scripts/apply-systems-migration.ts`), matching the repo's existing `apply-*-migration.ts` pattern. | Forced by the empty drizzle history, see O3. Idempotent, safe to re-run. |

## Open decisions

| # | Raised | Question | Blocking? |
|---|--------|----------|-----------|
| O1 | 2026-08-25 | Which plans include the Systems module? | Not blocking build; **blocks launch**. |
| O2 | 2026-08-25 | ~~Does a fragility map exist as data?~~ **Closed.** It does not. Resolved by D9. | Closed. |
| O3 | 2026-09-01 | **Baseline drizzle's migration history.** `__drizzle_migrations` is empty while the database is fully built, so `npm run db:migrate` replays from 0000 and aborts on the first existing object. Every migration currently needs a hand-written apply script. | Not blocking; **compounds with every migration**. |
| O4 | 2026-09-01 | **Export target field names are unverified.** The Jolt, Trail, Xenia and Restoke label sets were written from memory, not from live documentation, against Julian's standing rule. Recommendation: ship generic-only, add named targets once verified, starting with Restoke. | Blocks shipping named targets. |
| O5 | 2026-09-01 | Page and shell work, parked at Julian's instruction: left and right rails, the explainer eating the fold, nav missing on `/score` and `/diagnostic`, the "Ask draws on your scores" naming defect, internals named advisor while the UI says Ask, and a new public home page naming the method. | Parked until Systems is committed. |

## Blockers outside this build

- **The Anthropic API key has no credit.** `/api/chat/health` returns "Your credit balance is too low to access the Anthropic API." The procedure audit returns 502 as a result, and the audit path is therefore **unverified end to end**. This is app-wide: Ask, the weekly prescription emails and the Deep Diagnostic reports use the same key, in production as well as locally.
- **Supabase was paused** and was resumed on 1 Sep 2026 after an upgrade to Pro. Production had been partially down: prerendered marketing pages served, everything touching the database or auth did not.
- **Production is well behind `develop`.** Last Netlify publish 29 June 2026.

## Repo notes worth keeping

- **No RLS anywhere.** Ownership is enforced in the route and in `requireSystemsContext` for pages. A wrong-venue resource returns 404, not 403, so endpoints do not confirm other people's venues exist.
- **Client components must not import from modules that reach `@/db`, the Anthropic SDK, or the Supabase server clients.** Doing so pulls `postgres` and its Node built-ins into the browser bundle and fails the build. Shared constants live in `src/lib/systems/limits.ts` for this reason.
- **`.vbd-cta` carries no size.** Always `vbd-cta vbd-cta-lg vbd-cta-primary|outline`.
- **Migration 0006 was hand-written** with no snapshot, so 0007 re-emitted `book_chunks`. Those statements are `IF NOT EXISTS`, and the 0007 snapshot now includes the table.

## Build state at v1.2

S1 schema and migration, S2 library core, S3 endpoints, S4 screens and S5 queue and export are all built. Gate green on Julian's machine: 256 tests, 0 lint errors, production build compiled. Walked in the browser against the real database: breakpoint creation, describe-a-shift ingest, the verdict screen, the procedure screen, and no console errors on `/systems`, `/dashboard` or `/domains`. The audit itself is blocked on the Anthropic credit balance. Nothing is committed or pushed.
