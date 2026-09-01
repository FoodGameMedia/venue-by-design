/**
 * The procedure service: create from ingest, audit, list, patch, summarise.
 *
 * Sits between the routes and the database so the logic is testable without a
 * Next request, matching how `advisor.ts` is split from its routes.
 */
import { and, desc, eq } from "drizzle-orm";
import type Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import {
  checkins,
  diagnostics,
  domainScores,
  procedureAudits,
  procedureVersions,
  procedures,
} from "@/db/schema";
import type { Domain } from "@/lib/checkin-questions";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/diagnostic-questions";
import { listBreakpoints } from "./breakpoints";
import { buildFragilityProfile, type FragilityProfile } from "./fragility";
import { AUDIT_MODEL, auditProcedure, type ProcedureAudit } from "./procedure-audit";
import type { IngestResult } from "./procedure-ingest";
import type { ExportableProcedure } from "./procedure-text";
import { buildAuditSummary, summaryLines, type AuditedProcedureRef } from "./audit-summary";

export class ProcedureError extends Error {}

/**
 * Assemble the venue's fragility profile from what the app already holds.
 * Named breakpoints first, derived pressure alongside.
 */
export async function loadFragilityProfile(venueId: string): Promise<FragilityProfile> {
  const [breakpointRefs, scoreRows, latestCheckin, latestDiagnostic] = await Promise.all([
    listBreakpoints(venueId),
    db.query.domainScores.findMany({ where: eq(domainScores.venueId, venueId) }),
    db.query.checkins.findFirst({
      where: eq(checkins.venueId, venueId),
      orderBy: [desc(checkins.createdAt)],
      columns: { calmIndex: true },
    }),
    db.query.diagnostics.findFirst({
      where: eq(diagnostics.venueId, venueId),
      orderBy: [desc(diagnostics.createdAt)],
      columns: { responses: true },
    }),
  ]);

  return buildFragilityProfile({
    breakpoints: breakpointRefs,
    domainScores: scoreRows.map((r) => ({ domain: r.domain as Domain, score: r.score })),
    calmIndex: latestCheckin?.calmIndex ?? null,
    diagnosticResponses: (latestDiagnostic?.responses as Record<string, number>) ?? null,
    diagnosticQuestions: DIAGNOSTIC_QUESTIONS,
  });
}

export interface CreateProcedureInput {
  venueId: string;
  userId: string;
  ingest: IngestResult;
  title?: string | null;
  /** Storage path of the original upload, when there was one. */
  sourcePath?: string | null;
}

/**
 * Store an ingested procedure and its first version.
 *
 * Provenance is `imported` until an audit runs, which is what it is: something
 * the venue already had, not yet judged.
 */
export async function createProcedure(input: CreateProcedureInput) {
  const [procedure] = await db
    .insert(procedures)
    .values({
      venueId: input.venueId,
      userId: input.userId,
      title: input.title?.trim() || "Untitled procedure",
      provenance: "imported",
      status: "draft",
      sourcePath: input.sourcePath ?? null,
    })
    .returning();

  if (!procedure) {
    throw new ProcedureError("Could not save that procedure.");
  }

  const [version] = await db
    .insert(procedureVersions)
    .values({
      procedureId: procedure.id,
      versionNumber: 1,
      body: input.ingest.body,
      extractedFrom: input.ingest.extractedFrom,
      authoredBy: "ingest",
    })
    .returning();

  await db
    .update(procedures)
    .set({ currentVersionId: version.id, updatedAt: new Date() })
    .where(eq(procedures.id, procedure.id));

  return { procedure: { ...procedure, currentVersionId: version.id }, version };
}

/**
 * Run the audit on a procedure's current version and record the result.
 *
 * Provenance moves to `audited_keep` or `audited_rewrite` so the library can
 * later tell an imported keeper from something the module wrote. A retired
 * procedure keeps `imported`: it is not becoming part of the set.
 */
export async function runProcedureAudit(
  procedureId: string,
  venueId: string,
  venueName: string,
  client?: Anthropic
): Promise<{ audit: ProcedureAudit; auditId: string }> {
  const procedure = await db.query.procedures.findFirst({
    where: and(eq(procedures.id, procedureId), eq(procedures.venueId, venueId)),
  });

  if (!procedure) {
    throw new ProcedureError("Procedure not found.");
  }

  const version = await db.query.procedureVersions.findFirst({
    where: eq(procedureVersions.procedureId, procedureId),
    orderBy: [desc(procedureVersions.versionNumber)],
  });

  if (!version) {
    throw new ProcedureError("That procedure has no content to audit.");
  }

  const profile = await loadFragilityProfile(venueId);

  const audit = await auditProcedure(
    { body: version.body, title: procedure.title, venueName, profile },
    client
  );

  const [row] = await db
    .insert(procedureAudits)
    .values({
      procedureId,
      versionId: version.id,
      verdict: audit.verdict,
      questionResults: audit.questionResults,
      fragilitySnapshot: {
        calmIndex: profile.calmIndex,
        band: profile.band?.id ?? null,
        weakestDomains: profile.weakestDomains,
        breakpointIds: profile.breakpoints.map((b) => b.id),
      },
      summary: audit.summary,
      rewriteNotes: audit.rewriteNotes,
      rawResponse: audit as unknown as Record<string, unknown>,
      model: AUDIT_MODEL,
    })
    .returning();

  // A procedure we wrote already knows its name and the breakpoint it exists
  // for. Re-classifying an upload is the job; renaming our own draft thirty
  // seconds after writing it is not, and letting the model re-pick the
  // breakpoint let it choose a near-duplicate over the one the tick created.
  const isGenerated = procedure.provenance === "generated";

  await db
    .update(procedures)
    .set({
      title: isGenerated ? procedure.title : audit.title,
      domain: isGenerated && procedure.domain ? procedure.domain : audit.domain,
      breakpointId: procedure.breakpointId ?? audit.breakpointId,
      theDefault: audit.fields.theDefault,
      cue: audit.fields.cue,
      routine: audit.fields.routine,
      reinforcement: audit.fields.reinforcement,
      ownerRole: audit.fields.ownerRole,
      reviewCadence: audit.fields.reviewCadence,
      provenance:
        audit.verdict === "keep"
          ? "audited_keep"
          : audit.verdict === "rewrite"
            ? "audited_rewrite"
            : "imported",
      updatedAt: new Date(),
    })
    .where(eq(procedures.id, procedureId));

  await db
    .update(procedureVersions)
    .set({ fields: audit.fields })
    .where(eq(procedureVersions.id, version.id));

  return { audit, auditId: row.id };
}

export interface ProcedureListItem {
  id: string;
  title: string;
  domain: Domain | null;
  breakpointId: string | null;
  status: "draft" | "live" | "installed";
  verdict: "keep" | "rewrite" | "retire" | null;
  summary: string | null;
  updatedAt: Date;
}

/** Every procedure for a venue, each with its most recent verdict. */
export async function listProcedures(venueId: string): Promise<ProcedureListItem[]> {
  const rows = await db.query.procedures.findMany({
    where: eq(procedures.venueId, venueId),
    orderBy: [desc(procedures.updatedAt)],
  });

  if (rows.length === 0) return [];

  const audits = await db.query.procedureAudits.findMany({
    orderBy: [desc(procedureAudits.createdAt)],
  });

  const latestByProcedure = new Map<string, (typeof audits)[number]>();
  for (const audit of audits) {
    if (!latestByProcedure.has(audit.procedureId)) {
      latestByProcedure.set(audit.procedureId, audit);
    }
  }

  return rows.map((r) => {
    const audit = latestByProcedure.get(r.id);
    return {
      id: r.id,
      title: r.title,
      domain: r.domain as Domain | null,
      breakpointId: r.breakpointId,
      status: r.status,
      verdict: audit?.verdict ?? null,
      summary: audit?.summary ?? null,
      updatedAt: r.updatedAt,
    };
  });
}

/** The one-screen verdict. */
export async function getAuditSummary(venueId: string) {
  const [items, breakpointRefs] = await Promise.all([
    listProcedures(venueId),
    listBreakpoints(venueId),
  ]);

  const audited: AuditedProcedureRef[] = items
    .filter((i): i is ProcedureListItem & { verdict: NonNullable<ProcedureListItem["verdict"]> } =>
      i.verdict !== null
    )
    .map((i) => ({
      id: i.id,
      title: i.title,
      verdict: i.verdict,
      breakpointId: i.breakpointId,
    }));

  const summary = buildAuditSummary(audited, breakpointRefs);

  return {
    summary,
    lines: summaryLines(summary),
    unaudited: items.filter((i) => i.verdict === null).length,
  };
}

/** Everything the one-screen verdict needs for a single procedure. */
export async function getProcedureDetail(procedureId: string, venueId: string) {
  const procedure = await db.query.procedures.findFirst({
    where: and(eq(procedures.id, procedureId), eq(procedures.venueId, venueId)),
  });

  if (!procedure) return null;

  const [version, audit, breakpointRefs] = await Promise.all([
    db.query.procedureVersions.findFirst({
      where: eq(procedureVersions.procedureId, procedureId),
      orderBy: [desc(procedureVersions.versionNumber)],
    }),
    db.query.procedureAudits.findFirst({
      where: eq(procedureAudits.procedureId, procedureId),
      orderBy: [desc(procedureAudits.createdAt)],
    }),
    listBreakpoints(venueId),
  ]);

  return {
    procedure,
    version: version ?? null,
    audit: audit ?? null,
    breakpoint: procedure.breakpointId
      ? (breakpointRefs.find((b) => b.id === procedure.breakpointId) ?? null)
      : null,
  };
}

/**
 * Load a chosen set of procedures in the shape the exporters want.
 * Scoped to the venue, so an id from somewhere else simply does not come back.
 */
export async function loadProceduresForExport(
  venueId: string,
  procedureIds: readonly string[]
): Promise<ExportableProcedure[]> {
  if (procedureIds.length === 0) return [];

  const wanted = new Set(procedureIds);

  const [rows, breakpointRefs] = await Promise.all([
    db.query.procedures.findMany({ where: eq(procedures.venueId, venueId) }),
    listBreakpoints(venueId),
  ]);

  const byBreakpoint = new Map(breakpointRefs.map((b) => [b.id, b]));

  return rows
    .filter((r) => wanted.has(r.id))
    // Keep the operator's chosen order rather than the database's.
    .sort((a, b) => procedureIds.indexOf(a.id) - procedureIds.indexOf(b.id))
    .map((r) => {
      const breakpoint = r.breakpointId ? byBreakpoint.get(r.breakpointId) : undefined;
      return {
        title: r.title,
        domain: r.domain as Domain | null,
        theDefault: r.theDefault,
        cue: r.cue,
        routine: (r.routine ?? []) as string[],
        reinforcement: r.reinforcement,
        ownerRole: r.ownerRole,
        reviewCadence: r.reviewCadence,
        breakpoint: breakpoint
          ? { description: breakpoint.description, trigger: breakpoint.trigger }
          : null,
      };
    });
}

export interface ProcedurePatch {
  title?: string;
  status?: "draft" | "live" | "installed";
  verdictOverride?: "keep" | "rewrite" | "retire";
}

/**
 * Operator edits.
 *
 * `installed` is refused here. That state is reachable only through a recorded
 * rostered-off validation, which lands at version 1.1. A procedure that needs
 * its author in the building is not yet a design, and the software should not
 * let anyone shortcut that.
 */
export async function updateProcedure(
  procedureId: string,
  venueId: string,
  patch: ProcedurePatch
) {
  const existing = await db.query.procedures.findFirst({
    where: and(eq(procedures.id, procedureId), eq(procedures.venueId, venueId)),
  });

  if (!existing) {
    throw new ProcedureError("Procedure not found.");
  }

  if (patch.status === "installed") {
    throw new ProcedureError(
      "A procedure is only installed once it has held on a shift its author was rostered off. Record that first."
    );
  }

  const values: Record<string, unknown> = { updatedAt: new Date() };

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) throw new ProcedureError("A title is required.");
    values.title = title;
  }

  if (patch.status !== undefined) {
    values.status = patch.status;
  }

  const [row] = await db
    .update(procedures)
    .set(values)
    .where(eq(procedures.id, procedureId))
    .returning();

  if (patch.verdictOverride) {
    const version = await db.query.procedureVersions.findFirst({
      where: eq(procedureVersions.procedureId, procedureId),
      orderBy: [desc(procedureVersions.versionNumber)],
    });

    if (version) {
      await db.insert(procedureAudits).values({
        procedureId,
        versionId: version.id,
        verdict: patch.verdictOverride,
        questionResults: [],
        summary: "Verdict set by the operator.",
        model: "operator",
      });
    }
  }

  return row;
}
