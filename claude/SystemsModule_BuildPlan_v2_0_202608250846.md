# Systems Module, Stage 1 Build Plan

**Version:** 2.0
**Created:** 25 August 2026, 08:46 AEST
**Supersedes:** `SystemsModule_BuildPlan_v1_0_202608250836.md` (written before the spec was available)
**Authority:** The Systems Module build specification, July 2026, and `SystemsModule_DecisionsRecord_v1_0_202608250805.md`.
**Status:** For approval. No code written.

Major version bump because the spec changed the structure, not the detail. Three things in v1.0 were wrong and are corrected here: status and verdict were conflated, the procedure object was far thinner than the method requires, and the fragility map was treated as optional. Section 2 is the consequence.

---

## 1. What the spec settled

The three method questions, verbatim:

1. Is this a desire path, something people actually do when the room is full, or decorative paving that exists only to be shown?
2. Does it map to a real breakpoint, a moment the venue reliably breaks, or to a domain currently under pressure on the Calm Index?
3. Does it install a default, or merely issue a rule that a tired person has to remember and enforce?

And it settled the rest of what was open: the procedure object in cue, routine, reinforcement and owner format; status as draft, live, installed, with the rostered-off gate between live and installed; verdict as a separate axis of keep, rewrite or retire; MVP export as the PDF pack and copy-ready text only, with CSV, JSON and partner APIs held to version 2.

My four proposed decisions are answered or overtaken. D6 (ingest routes) is confirmed by the spec's own wording, vision for photographs and text extraction for documents. D8 (export scope) is answered by the queue. D5 (model) is still mine to recommend, section 7. D7 is no longer a proposal, see below.

---

## 2. The one conflict between the spec and the repo

**The spec treats the fragility map as an existing asset. It does not exist.**

The spec lists it under *Reused*, alongside the Calm Index diagnostic and the prescription engine, and builds on it in four places: method question 2 turns on it, the Breakpoint field is defined as a link to a fragility-map entry, the verdict screen must report breakpoints with no procedure covering them, and the build flow is triggered by a fragility-map entry the operator chooses to design out next.

The survey found nothing. No table, no column, no derived helper. The word appears only as the score label for `[1]` on the 0 to 3 scale, as the Calm band **Functional but Fragile**, as check-in option copy, and in chapter 05, where the map is defined as a short operator-written list of breakpoints, each with the small thing that triggers it, kept current in the weekly review.

The consequence is concrete. Without breakpoints as records, question 2 degrades to "or a domain under pressure on the Calm Index", which is only half the question; the Breakpoint field has nothing to point at; and the fourth line of the verdict, the one that names uncovered breakpoints, cannot be produced at all. That line is a quarter of the screen the spec calls the demonstrable hook.

**So the plan adds a fifth table, `breakpoints`, and a small capture flow.** The spec's *Added* list names four new tables. This is a deliberate departure from it, recorded here rather than slipped in, and it needs your call as **D9** before S1 starts.

Scope is small: three to five entries per venue, each a breakpoint and its trigger, one line each, exactly the chapter's table. Seeded at first audit by asking the operator to name them, guided by the chapter 05 prompts the spec already points at for the describe-a-shift door. Derived signal from `domain_scores`, `diagnostics.responses` and the latest `checkins` rides alongside as context, not as a substitute.

---

## 3. Conventions the survey fixed

| Concern | Pattern to match |
|---|---|
| Auth on API routes | `createClient()` for the session, `createAdminClient()` for data, ownership checked in the route. No RLS anywhere in `drizzle/*.sql`. |
| Claude calls | `src/lib/diagnostic-report.ts` and `prescription.ts`: typed result interface, system prompt carrying the seven domains and the 0 to 3 scale, explicit JSON schema in the user prompt, fence-stripping parse, injectable `client` for tests. |
| Models | `ANTHROPIC_MODELS.sonnet` (`claude-sonnet-4-6`) for chat and prescriptions, `.opus` (`claude-opus-4-8`) for the deep diagnostic. |
| Vision and PDF input | Not yet used anywhere in the app. This build introduces both, via native Anthropic content blocks. |
| PDF output | `pdf-lib` with a manual layout and a `wrapText` helper, per `diagnostic-pdf.ts`. Not `@react-pdf/renderer`, despite it being installed. |
| Storage | Private Supabase bucket, 10 MB limit, path `${userId}/${recordId}`, created by a script following `create-diagnostic-bucket.ts`. |
| Book retrieval | `src/lib/book-retrieval.ts`, FTS with keyword fallback, `formatBookExcerpts()` for prompt injection. Needed at version 1 for drafting, not at MVP. |
| Schema style | `uuid` PK `defaultRandom()`, cascade FKs to `users` and `venues`, timestamps with timezone, `jsonb` for payloads, `pgEnum` for closed sets. |
| Screens | Server component page plus a client form sibling, as in `/diagnostic` and `/checkin`. `src/components/ui` holds button, card, input and label only. |
| Type and palette | DM Serif Display and DM Sans are already wired in `layout.tsx` as `--font-serif` and `--font-sans`. Charcoal and champagne tokens are in `globals.css`. Nothing new to add. |
| Copy | `src/components/page-explainer.tsx`, one entry per page with a `testId`, asserted in `page-explainer.test.ts`. |
| Tests | Vitest, one file per lib module in `src/__tests__`, canonical-content tests for anything the book or the spec fixes. |

---

## 4. Proposed build, Stage 1 audit-first

### 4.1 Schema, one migration (`0007_systems_module.sql`)

All tables land now, per D1, even though MVP writes only some.

**Enums**

- `procedure_status`: `draft`, `live`, `installed`
- `procedure_verdict`: `keep`, `rewrite`, `retire`
- `procedure_provenance`: `generated`, `audited_keep`, `audited_rewrite`, `imported`
- `procedure_export_format`: `pdf`, `text`, `csv`, `json`, `api`

Status and verdict are separate axes. An audited procedure has a verdict immediately and a status of `draft` until the operator puts it into use. Only the rostered-off record moves it to `installed`, and that gate is version 1.1.

**`breakpoints`** (the fragility map, see section 2)
`id`, `venue_id`, `user_id`, `description`, `trigger`, `domain` (existing `domain` enum, nullable), `resolved_at` (nullable), `created_at`, `updated_at`.

**`procedures`**
`id`, `venue_id`, `user_id`, `title`, `domain`, `breakpoint_id` (nullable FK), `the_default` (one line), `cue`, `routine` (jsonb, ordered steps), `reinforcement`, `owner_role`, `review_cadence`, `status`, `provenance`, `source_path` (storage path for the original, nullable), `current_version_id`, `created_at`, `updated_at`.

At MVP the audit populates title, domain, breakpoint link and provenance. The habit-format fields are extracted where the source procedure contains them and left null where it does not, which is itself audit signal: a procedure with no cue and no owner is rarely a desire path.

**`procedure_versions`** (the audit trail)
`id`, `procedure_id`, `version_number`, `body` (extracted, normalised text), `fields` (jsonb snapshot of the habit-format fields at that version), `extracted_from` (jsonb: ingest method, filename, mime, page or image count), `authored_by` (`operator`, `ai_draft`, `ingest`), `created_at`. Unique index on `(procedure_id, version_number)`.

**`procedure_validations`** (the rostered-off records)
`id`, `procedure_id`, `version_id`, `validated_on` (date), `author_away` (text, who was rostered off), `held` (boolean), `notes`, `created_at`. Written from version 1.1. Landing the table now costs nothing and avoids a second migration later.

**`procedure_exports`**
`id`, `venue_id`, `user_id`, `format`, `procedure_ids` (jsonb array), `storage_path` (nullable), `target` (text, nullable: `jolt`, `trail`, `xenia`, `restoke`, `generic`), `created_at`.

**Audit results.** The three question scores and the verdict rationale attach to the version that was audited, in a fifth table `procedure_audits`: `id`, `procedure_id`, `version_id`, `verdict`, `question_results` (jsonb, three entries, each a result and a one-line rationale), `fragility_snapshot` (jsonb: calm index, band, domain scores, breakpoints as they stood), `summary`, `rewrite_notes` (nullable), `raw_response` (jsonb), `model`, `created_at`.

That is two tables beyond the spec's four. `breakpoints` is the material one and needs D9. `procedure_audits` is bookkeeping: the alternative is overloading `procedure_validations`, which the spec reserves for the rostered-off record, and I would rather not blur the module's signature feature to save a table. Call it **D10**.

### 4.2 Storage

Two private buckets, created by `scripts/create-procedure-buckets.ts`:

- `procedure-sources`, 10 MB limit, the original uploads.
- `procedure-exports`, 10 MB limit, the generated PDF packs.

### 4.3 Ingest, the three doors

- **Documents.** Word `.docx` via `mammoth` for server-side text extraction. PDF passed to Claude as a native document content block, which handles scanned binders without an OCR dependency.
- **Photographs.** JPG, PNG and WebP as image content blocks, up to five per procedure. A binder page or a laminated card.
- **Describe a shift.** Free text, prompted by the chapter 05 fragility questions. This door also seeds the breakpoints table.

The spec's fourth input, reading checklists from a connected enforcement tool, has no integration to read from and is out of Stage 1 by the spec's own roadmap.

`mammoth` is the only new runtime dependency the build needs.

### 4.4 Library modules (`src/lib/systems/`)

| File | Job |
|---|---|
| `method-questions.ts` | The three questions verbatim, the result scale, the verdict rule. Frozen constant, covered by a canonical-content test so the wording cannot drift. |
| `fragility.ts` | Reads the breakpoints table and derives the supporting signal from `domain_scores`, `diagnostics.responses` and the latest `checkins`. Pure function over fetched rows, fully unit tested. |
| `procedure-ingest.ts` | File to text or content blocks, size and type guards, normalisation, habit-field extraction. |
| `procedure-audit.ts` | The Claude call. Mirrors `diagnostic-report.ts` exactly: typed `ProcedureAudit` interface, system prompt carrying the method and the domains, JSON schema in the user prompt, injectable client. |
| `audit-summary.ts` | Rolls the per-procedure verdicts plus uncovered breakpoints into the one-screen verdict counts. |
| `procedure-pdf.ts` | The laminated-card-friendly PDF pack, `pdf-lib`, following `diagnostic-pdf.ts`. |
| `procedure-text.ts` | Copy-ready text, per target, using the spec's field mapping: cue to trigger, routine steps to checklist items, owner to assignee, review cadence to recurrence, the default and reinforcement to notes. Validation status is never exported. |

### 4.5 Endpoints (`src/app/api/systems/`)

| Route | Method | Job |
|---|---|---|
| `/api/systems/breakpoints` | `GET`, `POST`, `PATCH` | The fragility map. Create, list, edit, resolve. |
| `/api/systems/procedures` | `GET` | List with latest verdict and status. |
| `/api/systems/procedures` | `POST` | Ingest. Stores the original, extracts, writes the procedure plus version 1. |
| `/api/systems/procedures/[id]/audit` | `POST` | Classifies against the three questions, writes `procedure_audits`, sets domain, breakpoint link and verdict. |
| `/api/systems/procedures/[id]` | `PATCH` | Operator override of verdict or status, title and field edits. |
| `/api/systems/audit-summary` | `GET` | The verdict counts, including uncovered breakpoints. |
| `/api/systems/exports` | `POST` | Builds the PDF pack and the copy-ready text for the selected set, stores, writes `procedure_exports`, returns a signed URL plus the text. |

Every route: session check, then ownership check against `venues.user_id`, then act. No plan gate, per D2. All Claude calls server-side.

### 4.6 Screens

| Route | Screen |
|---|---|
| `/systems` | Index. Venue context, the procedure list with verdict and status chips, the live-procedure count, an explainer for the empty state, "Audit what you have". |
| `/systems/breakpoints` | The fragility map. Three to five entries, breakpoint and trigger, add and edit. |
| `/systems/new` | Ingest. Three doors: upload documents, upload photographs, describe a shift. |
| `/systems/audit` | **The verdict.** One screen, blunt: total, load-bearing, dead paving, to rewrite, and breakpoints with no procedure at all. Retiring framed as the win. |
| `/systems/[id]` | One procedure. The three questions with their results and one-line rationales, the fragility line, the verdict, and the keep, rewrite or retire actions. |
| `/systems/queue` | Keep, rewrite and retire columns. Multi-select, then export. |

Existing tokens, existing `ui` primitives, a `systems` entry added to `page-explainer.tsx`.

### 4.7 Tests

New vitest files: `systems-method-questions.test.ts` (canonical wording, cannot drift), `systems-fragility.test.ts` (derivation and edge cases: no breakpoints, no diagnostic, no check-ins, tied lowest domains), `systems-procedure-audit.test.ts` (mocked client, parse, fence stripping, malformed JSON), `systems-audit-summary.test.ts` (the counts, including uncovered breakpoints), `systems-procedure-pdf.test.ts` (smoke), `systems-procedure-text.test.ts` (the field mapping per target, and that validation status never appears in output). Plus an added assertion in `page-explainer.test.ts`.

---

## 5. Sequence

| Stage | Work | Presented at |
|---|---|---|
| S1 | Schema, migration, bucket script | Migration reviewed before you run it |
| S2 | Library core plus tests, no UI | Test run output |
| S3 | Breakpoints capture, ingest and audit endpoints | Endpoint contract plus tests |
| S4 | Screens: index, breakpoints, new, verdict, procedure | Screens |
| S5 | Queue, PDF pack and copy-ready text | A sample pack |
| S6 | Verification gate: vitest, typecheck, build | Full gate output |

Nothing commits or pushes unless you ask, per D4.

## 6. What you run locally

1. `npm install mammoth`
2. `npm run db:generate` then `npm run db:migrate`
3. `npx tsx scripts/create-procedure-buckets.ts`
4. `npm run dev`

---

## 7. Decisions needing your call before S1

| # | Question | My recommendation |
|---|---|---|
| D5 | Which model audits a procedure? | `sonnet`. It runs per procedure and often, and the task is classification against three fixed questions, not synthesis. Opus stays reserved for the deep diagnostic. |
| D9 | Add the `breakpoints` table and capture flow, departing from the spec's four-table list? | Yes. Section 2 sets out why. Without it, question 2 runs at half strength and the verdict screen loses the line that makes it land. |
| D10 | Separate `procedure_audits` from `procedure_validations`? | Yes. The spec defines validations as the rostered-off record and that is the module's signature feature. Overloading the table to save one migration is a poor trade. |

Once you rule, the decisions record goes to v1.1 with O2 closed and D5, D9 and D10 recorded.

---

## 8. Smaller ask, unchanged

The decisions record lives only in project storage, so the repo has no authority file on disk. I propose a `claude/` folder in the repo holding the record and this plan. Both plan versions are there now, uncommitted, awaiting your call.

---

*End of v2.0.*
