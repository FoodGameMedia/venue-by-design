import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  integer,
  real,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────────────

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "unpaid",
  "paused",
]);

export const pricingPlanEnum = pgEnum("pricing_plan", [
  "free",
  "essentials",
  "pro",
  "group",
]);

export const venueStatusEnum = pgEnum("venue_status", [
  "draft",
  "active",
  "archived",
]);

export const venueTypeEnum = pgEnum("venue_type", [
  "restaurant",
  "cafe",
  "bar",
  "pub",
  "hotel_fb",
  "large_format",
  // Not everyone fits the five. "Other" is a real answer, and it differs from
  // unset: unset means we have not asked, other means none of ours fit.
  "other",
]);

export const domainEnum = pgEnum("domain", [
  "throughput",
  "defaults",
  "signals",
  "pacing",
  "endings",
  "people_load",
  "operational_memory",
]);

export const advisorStatusEnum = pgEnum("advisor_status", [
  "pending",
  "approved",
  "rejected",
]);

// ── Systems Module enums ───────────────────────────────────────────────────────

/**
 * Lifecycle of a procedure. Separate axis from the audit verdict.
 * `installed` is reachable only via a rostered-off validation record (v1.1).
 */
export const procedureStatusEnum = pgEnum("procedure_status", [
  "draft",
  "live",
  "installed",
]);

/** Audit outcome for a procedure. Keep, rewrite as a default, or retire. */
export const procedureVerdictEnum = pgEnum("procedure_verdict", [
  "keep",
  "rewrite",
  "retire",
]);

/** Where the procedure came from. */
export const procedureProvenanceEnum = pgEnum("procedure_provenance", [
  "generated",
  "audited_keep",
  "audited_rewrite",
  "imported",
]);

/** Export routes. Only pdf and text are used at Stage 1. */
export const procedureExportFormatEnum = pgEnum("procedure_export_format", [
  "pdf",
  "text",
  "csv",
  "json",
  "api",
]);

/** Who wrote a given procedure version. */
export const procedureAuthorEnum = pgEnum("procedure_author", [
  "operator",
  "ai_draft",
  "ingest",
]);

/**
 * What the operator said about a catalogue item. Both answers are diagnostic:
 * `not_working` is a candidate breakpoint, not just a gap.
 */
export const catalogueSelectionStateEnum = pgEnum("catalogue_selection_state", [
  "missing",
  "not_working",
]);

/**
 * Obligations outside our remit. `sourced` means the operator has obtained it
 * from the authority; we never write it and never audit it.
 */
export const obligationStatusEnum = pgEnum("obligation_status", [
  "have",
  "missing",
  "sourced",
]);

// ── Users ──────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: text("auth_id").unique().notNull(),
  email: text("email").unique().notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Subscriptions ──────────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique().notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripePriceId: text("stripe_price_id").notNull(),
  plan: pricingPlanEnum("plan").default("free").notNull(),
  status: subscriptionStatusEnum("status").default("trialing").notNull(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Venues ─────────────────────────────────────────────────────────────────────

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  venueType: venueTypeEnum("venue_type"),
  staffCount: integer("staff_count"),
  description: text("description"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postcode: text("postcode"),
  country: text("country").default("AU").notNull(),
  status: venueStatusEnum("status").default("draft").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Check-ins ──────────────────────────────────────────────────────────────────

export const checkins = pgTable("checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id")
    .references(() => venues.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  responses: jsonb("responses").notNull(), // { throughput: 2, defaults: 1, ... }
  calmIndex: real("calm_index").notNull(), // (total/21)*10
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Domain Scores (rolling per venue) ──────────────────────────────────────────

export const domainScores = pgTable("domain_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id")
    .references(() => venues.id, { onDelete: "cascade" })
    .notNull(),
  domain: domainEnum("domain").notNull(),
  score: real("score").notNull(), // rolling average 0-3
  checkinCount: integer("checkin_count").default(1).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Prescriptions ─────────────────────────────────────────────────────────────

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  checkinId: uuid("checkin_id")
    .references(() => checkins.id, { onDelete: "cascade" })
    .notNull(),
  venueId: uuid("venue_id")
    .references(() => venues.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  calmIndex: real("calm_index").notNull(),
  primaryDomain: domainEnum("primary_domain").notNull(),
  primaryProblem: text("primary_problem").notNull(),
  interventions: jsonb("interventions").notNull(), // string[]
  weekFocus: text("week_focus").notNull(),
  watchSignal: text("watch_signal").notNull(),
  rawResponse: jsonb("raw_response"), // full AI response for debugging
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Diagnostic Purchases (one-time Stripe payment) ─────────────────────────────

export const diagnosticPurchases = pgTable("diagnostic_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSessionId: text("stripe_session_id"),
  plan: text("plan").notNull(), // "solo" | "staff_pulse"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Diagnostics (Deep Diagnostic submissions & reports) ────────────────────────

export const diagnostics = pgTable("diagnostics", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id")
    .references(() => venues.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  responses: jsonb("responses").notNull(), // { q1: 0, q2: 1, ... } 40 questions
  calmIndex: real("calm_index"),
  reportRaw: jsonb("report_raw"), // Full AI report JSON
  reportPdfPath: text("report_pdf_path"), // Supabase Storage path
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Advisor Accounts (Advisor Portal, separate account type) ───────────────────

export const advisorAccounts = pgTable("advisor_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: text("auth_id").unique().notNull(),
  email: text("email").unique().notNull(),
  businessName: text("business_name").notNull(),
  status: advisorStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Advisor Clients (advisor → client venue relationships) ─────────────────────

export const advisorClients = pgTable("advisor_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  advisorId: uuid("advisor_id")
    .references(() => advisorAccounts.id, { onDelete: "cascade" })
    .notNull(),
  venueId: uuid("venue_id")
    .references(() => venues.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Design Projects ────────────────────────────────────────────────────────────

export const designProjects = pgTable("design_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id")
    .references(() => venues.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  aiPrompt: text("ai_prompt"),
  aiResult: jsonb("ai_result"),
  generationCount: integer("generation_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Book Chunks (Ask advisor manuscript memory) ─────────────────────────────────

export const bookChunks = pgTable(
  "book_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: text("book_id").notNull(),
    chapter: text("chapter").notNull(),
    content: text("content").notNull(),
    contentHash: text("content_hash").notNull(),
    sourcePath: text("source_path").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("book_chunks_source_chunk_idx").on(table.sourcePath, table.chunkIndex),
  ]
);

// ── Breakpoints (the fragility map) ────────────────────────────────────────────

/**
 * The venue's fragility map: the handful of moments it reliably breaks, each
 * with the small thing that triggers it. Canonical from The Calm Venue ch.05.
 *
 * Decision D9: the spec treats the fragility map as an existing asset, but the
 * app has never collected it. Method question 2 and the "breakpoints with no
 * procedure" line of the audit verdict both depend on these rows existing.
 */
export const breakpoints = pgTable("breakpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id")
    .references(() => venues.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").notNull(), // what reliably goes wrong
  trigger: text("trigger").notNull(), // the small thing that starts it
  domain: domainEnum("domain"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Procedures (the core artifact of the Systems module) ───────────────────────

/**
 * One procedure in the book's cue / routine / reinforcement / owner format.
 * At Stage 1 the audit fills title, domain, breakpoint link and provenance;
 * the habit-format fields are populated where the source contains them and
 * left null where it does not, which is itself audit signal.
 */
export const procedures = pgTable("procedures", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id")
    .references(() => venues.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  domain: domainEnum("domain"),
  breakpointId: uuid("breakpoint_id").references(() => breakpoints.id, {
    onDelete: "set null",
  }),
  theDefault: text("the_default"), // the decision, rule or buffer it installs
  cue: text("cue"), // the fixed point in the day it attaches to
  routine: jsonb("routine"), // string[] of ordered steps
  reinforcement: text("reinforcement"), // what visibly improves when it holds
  ownerRole: text("owner_role"), // a named role, never "everyone"
  reviewCadence: text("review_cadence"),
  status: procedureStatusEnum("status").default("draft").notNull(),
  provenance: procedureProvenanceEnum("provenance").notNull(),
  sourcePath: text("source_path"), // Supabase Storage path for the original
  currentVersionId: uuid("current_version_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Procedure Versions (the audit trail) ───────────────────────────────────────

export const procedureVersions = pgTable(
  "procedure_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    procedureId: uuid("procedure_id")
      .references(() => procedures.id, { onDelete: "cascade" })
      .notNull(),
    versionNumber: integer("version_number").notNull(),
    body: text("body").notNull(), // extracted, normalised procedure text
    fields: jsonb("fields"), // habit-format field snapshot at this version
    extractedFrom: jsonb("extracted_from"), // ingest method, filename, mime, counts
    authoredBy: procedureAuthorEnum("authored_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("procedure_versions_procedure_version_idx").on(
      table.procedureId,
      table.versionNumber
    ),
  ]
);

// ── Procedure Audits (the three method questions and the verdict) ──────────────

/**
 * Decision D10: kept separate from procedure_validations, which the spec
 * reserves for the rostered-off record. Different questions, different moment.
 */
export const procedureAudits = pgTable("procedure_audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  procedureId: uuid("procedure_id")
    .references(() => procedures.id, { onDelete: "cascade" })
    .notNull(),
  versionId: uuid("version_id")
    .references(() => procedureVersions.id, { onDelete: "cascade" })
    .notNull(),
  verdict: procedureVerdictEnum("verdict").notNull(),
  questionResults: jsonb("question_results").notNull(), // 3 entries: result + rationale
  fragilitySnapshot: jsonb("fragility_snapshot"), // calm index, band, domain scores, breakpoints
  summary: text("summary").notNull(),
  rewriteNotes: text("rewrite_notes"),
  rawResponse: jsonb("raw_response"),
  model: text("model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Procedure Validations (the rostered-off records) ───────────────────────────

/**
 * The gate between `live` and `installed`. Written from v1.1.
 * A procedure that needs its author in the building is not yet a design.
 */
export const procedureValidations = pgTable("procedure_validations", {
  id: uuid("id").primaryKey().defaultRandom(),
  procedureId: uuid("procedure_id")
    .references(() => procedures.id, { onDelete: "cascade" })
    .notNull(),
  versionId: uuid("version_id")
    .references(() => procedureVersions.id, { onDelete: "cascade" })
    .notNull(),
  validatedOn: timestamp("validated_on", { withTimezone: true }).notNull(),
  authorAway: text("author_away").notNull(), // who was rostered off
  held: boolean("held").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Procedure Exports ──────────────────────────────────────────────────────────

// ── Catalogue selections (what the operator ticked) ────────────────────────────

/**
 * One row per catalogue item the operator ticked, per venue.
 *
 * `itemId` is a catalogue item id or a venue-type addition id, both of which are
 * code constants rather than rows, so there is no foreign key. The unique index
 * means a re-tick updates rather than duplicating.
 *
 * A `not_working` tick is diagnostic. `breakpointId` records the breakpoint it
 * was promoted into, so the catalogue feeds the fragility map rather than
 * bypassing it.
 */
export const catalogueSelections = pgTable(
  "catalogue_selections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .references(() => venues.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    itemId: text("item_id").notNull(),
    state: catalogueSelectionStateEnum("state").notNull(),
    /** Set when a not_working tick has been promoted onto the fragility map. */
    breakpointId: uuid("breakpoint_id").references(() => breakpoints.id, {
      onDelete: "set null",
    }),
    /** Set once this tick has produced a procedure. */
    procedureId: uuid("procedure_id").references(() => procedures.id, {
      onDelete: "set null",
    }),
    /** The operator's chosen order when more than the minimum set is ticked. */
    installOrder: integer("install_order"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("catalogue_selections_venue_item_idx").on(table.venueId, table.itemId),
  ]
);

// ── Venue obligations (outside our remit) ──────────────────────────────────────

/**
 * The payroll, safety and licensing headings. We list them, we point at the
 * authority, we never write them and never audit them.
 */
export const venueObligations = pgTable(
  "venue_obligations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .references(() => venues.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    obligationId: text("obligation_id").notNull(),
    status: obligationStatusEnum("status").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("venue_obligations_venue_obligation_idx").on(
      table.venueId,
      table.obligationId
    ),
  ]
);

export const procedureExports = pgTable("procedure_exports", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id")
    .references(() => venues.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  format: procedureExportFormatEnum("format").notNull(),
  procedureIds: jsonb("procedure_ids").notNull(), // uuid[]
  storagePath: text("storage_path"),
  target: text("target"), // jolt | trail | xenia | restoke | generic
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
