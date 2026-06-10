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
