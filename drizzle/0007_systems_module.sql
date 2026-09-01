CREATE TYPE "public"."procedure_author" AS ENUM('operator', 'ai_draft', 'ingest');--> statement-breakpoint
CREATE TYPE "public"."procedure_export_format" AS ENUM('pdf', 'text', 'csv', 'json', 'api');--> statement-breakpoint
CREATE TYPE "public"."procedure_provenance" AS ENUM('generated', 'audited_keep', 'audited_rewrite', 'imported');--> statement-breakpoint
CREATE TYPE "public"."procedure_status" AS ENUM('draft', 'live', 'installed');--> statement-breakpoint
CREATE TYPE "public"."procedure_verdict" AS ENUM('keep', 'rewrite', 'retire');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "book_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" text NOT NULL,
	"chapter" text NOT NULL,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"source_path" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "breakpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"description" text NOT NULL,
	"trigger" text NOT NULL,
	"domain" "domain",
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedure_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"procedure_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"verdict" "procedure_verdict" NOT NULL,
	"question_results" jsonb NOT NULL,
	"fragility_snapshot" jsonb,
	"summary" text NOT NULL,
	"rewrite_notes" text,
	"raw_response" jsonb,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedure_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"format" "procedure_export_format" NOT NULL,
	"procedure_ids" jsonb NOT NULL,
	"storage_path" text,
	"target" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedure_validations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"procedure_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"validated_on" timestamp with time zone NOT NULL,
	"author_away" text NOT NULL,
	"held" boolean NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedure_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"procedure_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"body" text NOT NULL,
	"fields" jsonb,
	"extracted_from" jsonb,
	"authored_by" "procedure_author" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"domain" "domain",
	"breakpoint_id" uuid,
	"the_default" text,
	"cue" text,
	"routine" jsonb,
	"reinforcement" text,
	"owner_role" text,
	"review_cadence" text,
	"status" "procedure_status" DEFAULT 'draft' NOT NULL,
	"provenance" "procedure_provenance" NOT NULL,
	"source_path" text,
	"current_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "breakpoints" ADD CONSTRAINT "breakpoints_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breakpoints" ADD CONSTRAINT "breakpoints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedure_audits" ADD CONSTRAINT "procedure_audits_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedure_audits" ADD CONSTRAINT "procedure_audits_version_id_procedure_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."procedure_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedure_exports" ADD CONSTRAINT "procedure_exports_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedure_exports" ADD CONSTRAINT "procedure_exports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedure_validations" ADD CONSTRAINT "procedure_validations_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedure_validations" ADD CONSTRAINT "procedure_validations_version_id_procedure_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."procedure_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedure_versions" ADD CONSTRAINT "procedure_versions_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_breakpoint_id_breakpoints_id_fk" FOREIGN KEY ("breakpoint_id") REFERENCES "public"."breakpoints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "book_chunks_source_chunk_idx" ON "book_chunks" USING btree ("source_path","chunk_index");--> statement-breakpoint
CREATE UNIQUE INDEX "procedure_versions_procedure_version_idx" ON "procedure_versions" USING btree ("procedure_id","version_number");