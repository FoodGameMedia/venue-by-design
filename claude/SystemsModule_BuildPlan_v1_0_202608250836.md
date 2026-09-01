# Systems Module, Stage 1 Build Plan

**Version:** 1.0
**Created:** 25 August 2026, 08:36 AEST
**Authority:** `JulianBlok_Spec_SystemsModuleSOPBuilder_v1_0_202607121200.docx` (product) and `SystemsModule_DecisionsRecord_v1_0_202608250805.md` (build decisions).
**Status:** For approval. No code written.

---

## 1. Bridge and repo state, verified

`develop` @ `0c60be8`, clean, in sync with origin. Only untracked items are `.claude/` and `.cursor/skills/`, neither of which belongs to this build. The folder bridge reads and writes correctly.

The decisions record and the spec are not in the repo. They live in project storage only. See section 8.

---

## 2. Open decision O2, resolved by survey

**There is no fragility map as data.** Nothing in the schema, no table, no column, no derived helper. The word appears in exactly four places:

1. `src/lib/diagnostic-questions.ts`, as the label for score `[1]` on the 0 to 3 scale (failing, fragile, functional, designed).
2. `src/lib/domains.ts`, as the Calm Index band **Functional but Fragile** (5 to 7).
3. `src/lib/checkin-questions.ts`, as option copy, "Fragile and carried by people".
4. `content/books/the-calm-venue/05-fragility-mapping-and-knowing-your-slope.md`, where the fragility map is defined as a short operator-written list of **breakpoints**, each with the small thing that triggers it, kept current in the weekly review.

So the book's fragility map is operator-authored data that the app has never collected.

**Proposed source, in two parts:**

- **Derived fragility profile (Stage 1, no new operator input).** Computed at audit time from data the app already holds: the venue's two lowest `domain_scores`, every diagnostic question scored 0 or 1 grouped by domain, the latest `checkins.calmIndex` and its band. This gives the auditor a concrete "where this venue actually breaks" signal without asking the operator for anything new. It also matches the chapter's own instruction: lay the breakpoints beside the two lowest Calm Index scores and the overlap is the first target.
- **Operator-named breakpoints (proposed for Stage 1, small).** Three to five free-text breakpoints with triggers, stored on the venue, editable, fed into the audit alongside the derived profile. This is the chapter's actual artefact and it is roughly one form and one column. Flagged as decision D7 below rather than assumed.

---

## 3. What the survey fixed as conventions to follow

| Concern | Existing pattern to match |
|---|---|
| Auth on API routes | `createClient()` for the session, `createAdminClient()` for data, ownership checked in the route. No RLS anywhere in `drizzle/*.sql`. |
| Claude calls | `src/lib/diagnostic-report.ts`: typed result interface, system prompt with the seven domains, explicit JSON schema in the user prompt, fence-stripping parse, injectable `client` for tests. |
| Models | `ANTHROPIC_MODELS.sonnet` (`claude-sonnet-4-6`) for chat and prescriptions, `.opus` (`claude-opus-4-8`) for the deep diagnostic. |
| PDF | `pdf-lib` with a manual layout and a `wrapText` helper, as in `src/lib/diagnostic-pdf.ts`. Not `@react-pdf/renderer`, despite it being installed. |
| Storage | Private Supabase bucket, 10 MB limit, path `${userId}/${recordId}.pdf`, created by a one-off script following `scripts/create-diagnostic-bucket.ts`. |
| Book retrieval | `src/lib/book-retrieval.ts`, FTS with keyword fallback, `formatBookExcerpts()` for prompt injection. |
| Schema style | `uuid` PK `defaultRandom()`, cascade FKs to `users` and `venues`, `timestamp` with timezone, `jsonb` for payloads, `pgEnum` for closed sets. |
| Screens | Server component page plus a client form sibling, as in `/diagnostic` and `/checkin`. `src/components/ui` has button, card, input, label only. |
| Copy | `src/components/page-explainer.tsx` carries the per-page explainer with a `testId`, asserted in `src/__tests__/page-explainer.test.ts`. |
| Tests | Vitest, one file per lib module in `src/__tests__`, canonical-content tests for anything the book fixes. |

---

## 4. Proposed build, Stage 1 audit-only

### 4.1 Schema, one migration (`0007_systems_module.sql`)

All four tables land now, per D1.

**Enums**

- `procedure_source`: `upload_doc`, `upload_pdf`, `upload_photo`, `pasted_text`, `described_shift`
- `procedure_status`: `draft`, `audited`, `keep`, `rewrite`, `retire`, `archived`
- `procedure_verdict`: `keep`, `rewrite`, `retire`
- `procedure_export_format`: `pdf`, `text`

**`procedures`**
`id`, `venue_id`, `user_id`, `title`, `domain` (existing `domain` enum, nullable, set by the classifier), `source`, `source_path` (storage path for the original, nullable), `status`, `current_version_id`, `created_at`, `updated_at`.

**`procedure_versions`**
`id`, `procedure_id`, `version_number`, `body` (extracted and normalised text), `extracted_from` (jsonb: filename, mime, page or image count, extraction method), `authored_by` (`operator` or `ai_rewrite`), `created_at`. Unique index on `(procedure_id, version_number)`.

**`procedure_validations`**
`id`, `procedure_id`, `version_id`, `verdict`, `question_scores` (jsonb: one entry per method question with score and a one-line rationale), `fragility_snapshot` (jsonb: calm index, band, domain scores, low domains, breakpoints as they stood at audit time), `summary`, `rewrite_notes` (nullable), `raw_response` (jsonb), `model`, `created_at`.

**`procedure_exports`**
`id`, `venue_id`, `user_id`, `format`, `procedure_ids` (jsonb array), `storage_path` (nullable), `created_at`.

Only `procedures`, `procedure_versions` and `procedure_validations` are written at MVP. `procedure_exports` is written by the export endpoint.

### 4.2 Storage

Two private buckets, created by `scripts/create-procedure-buckets.ts`:

- `procedure-sources`, 10 MB limit, holds the original upload.
- `procedure-exports`, 10 MB limit, holds the generated PDF pack.

### 4.3 Ingest routes into text

- **Pasted text** and **described shift**: straight through, no extraction.
- **PDF**: passed to Claude as a native document content block. Handles scanned PDFs without an OCR dependency.
- **Photo** (jpg, png, webp), up to five per procedure: passed as image content blocks.
- **Word .docx**: `mammoth` for server-side text extraction. This is the only new runtime dependency the build needs.

### 4.4 Library modules (`src/lib/systems/`)

| File | Job |
|---|---|
| `method-questions.ts` | The three method questions, canonical from the spec, plus the scoring scale and the verdict rule. Frozen constant, covered by a content test. |
| `fragility-profile.ts` | Derives the fragility profile from `domain_scores`, `diagnostics.responses` and the latest `checkins`. Pure function, fully unit tested. |
| `procedure-ingest.ts` | File to text or content blocks, size and type guards, normalisation. |
| `procedure-audit.ts` | The Claude call. Mirrors `diagnostic-report.ts` exactly: typed `ProcedureAudit` interface, system prompt carrying the method and the domains, JSON schema in the user prompt, injectable client. |
| `procedure-pdf.ts` | The PDF pack, `pdf-lib`, following `diagnostic-pdf.ts`. |
| `procedure-text.ts` | Copy-ready plain text output. |

### 4.5 Endpoints (`src/app/api/systems/`)

| Route | Method | Job |
|---|---|---|
| `/api/systems/procedures` | `GET` | List the venue's procedures with their latest verdict. |
| `/api/systems/procedures` | `POST` | Ingest. Stores the original, extracts, writes `procedures` plus version 1. |
| `/api/systems/procedures/[id]/audit` | `POST` | Runs the classification, writes `procedure_validations`, sets domain, verdict and status. |
| `/api/systems/procedures/[id]` | `PATCH` | Operator override of verdict or status. Title edits. |
| `/api/systems/exports` | `POST` | Builds the PDF pack and the copy-ready text for a selected set, stores, writes `procedure_exports`, returns a signed URL plus the text. |

Every route: session check, ownership check against `venues.user_id`, then act. No plan gate, per D2.

### 4.6 Screens

| Route | Screen |
|---|---|
| `/systems` | Index. Venue context, the procedure list with verdict chips, an explainer for the empty state, "Add a procedure". |
| `/systems/new` | Ingest. Four tabs: upload a document, upload photos, paste text, describe the shift. |
| `/systems/[id]` | **The one-screen verdict.** Title and domain, the three method questions each with its result and one-line rationale, the fragility line naming the venue's two weakest domains, the verdict, and the three actions. |
| `/systems/queue` | Keep, rewrite and retire columns. Multi-select, then export. |

Existing tokens and `src/components/ui` primitives. A `systems` entry added to `page-explainer.tsx`.

### 4.7 Tests

New vitest files: `systems-method-questions.test.ts` (canonical content), `systems-fragility-profile.test.ts` (derivation, edge cases: no diagnostic, no check-ins, tied lowest domains), `systems-procedure-audit.test.ts` (mocked client, parse, fence stripping, malformed JSON), `systems-procedure-pdf.test.ts` (smoke), `systems-procedure-text.test.ts` (formatting), plus an added assertion in `page-explainer.test.ts`.

---

## 5. Sequence

| Stage | Work | Presented at |
|---|---|---|
| S1 | Schema, migration, bucket script | Migration reviewed before you run it |
| S2 | Library core plus tests, no UI | Test run output |
| S3 | Ingest and audit endpoints | Endpoint contract plus tests |
| S4 | Screens: index, new, verdict | Screens |
| S5 | Queue and export | Sample PDF pack |
| S6 | Verification gate: vitest, typecheck, build | Full gate output |

Nothing commits or pushes unless you ask, per D4.

## 6. What you run locally

1. `npm install mammoth`
2. `npm run db:generate` then `npm run db:migrate`
3. `npx tsx scripts/create-procedure-buckets.ts`
4. `npm run dev`

---

## 7. Decisions this plan raises

| # | Question | My recommendation |
|---|---|---|
| D5 | Which model audits a procedure? | `sonnet`. It is per-procedure and frequent. Opus stays reserved for the deep diagnostic. |
| D6 | Ingest routes as described in 4.3, with `mammoth` as the one new dependency? | Yes. It avoids an OCR stack entirely. |
| D7 | Operator-named breakpoints in Stage 1, or derived fragility only? | Include them. They are the chapter's actual artefact, they cost one form and one column, and the audit is materially better with them. |
| D8 | Does the export pack cover the whole queue or only the selected set? | Selected set, with a select-all. |

---

## 8. The one thing blocking

**The spec is not available to this session.** It is not in the repo and it is not in project storage; only the decisions record, the handover, the manuscript, the setup guide and the book review are there.

Everything above holds without it. What does not is the core of the classifier: the exact wording of the three method questions, the scoring scale they use, the rule that turns three answers into keep, rewrite or retire, and the required contents of the export pack. I will not guess at any of those, because they are the product.

Please re-attach `JulianBlok_Spec_SystemsModuleSOPBuilder_v1_0_202607121200.docx`.

**Separate, smaller ask:** the decisions record lives only in project storage, so the repo has no authority file. I propose adding a `claude/` folder to the repo holding the decisions record and this plan, so the build has a single source of truth on disk. This plan is written there already, uncommitted, awaiting your call.

---

*End of v1.0.*
