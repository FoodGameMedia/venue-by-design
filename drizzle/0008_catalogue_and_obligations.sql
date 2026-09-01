CREATE TYPE "public"."catalogue_selection_state" AS ENUM('missing', 'not_working');--> statement-breakpoint
CREATE TYPE "public"."obligation_status" AS ENUM('have', 'missing', 'sourced');--> statement-breakpoint
CREATE TABLE "catalogue_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"state" "catalogue_selection_state" NOT NULL,
	"breakpoint_id" uuid,
	"procedure_id" uuid,
	"install_order" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"obligation_id" text NOT NULL,
	"status" "obligation_status" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalogue_selections" ADD CONSTRAINT "catalogue_selections_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_selections" ADD CONSTRAINT "catalogue_selections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_selections" ADD CONSTRAINT "catalogue_selections_breakpoint_id_breakpoints_id_fk" FOREIGN KEY ("breakpoint_id") REFERENCES "public"."breakpoints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_selections" ADD CONSTRAINT "catalogue_selections_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_obligations" ADD CONSTRAINT "venue_obligations_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_obligations" ADD CONSTRAINT "venue_obligations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalogue_selections_venue_item_idx" ON "catalogue_selections" USING btree ("venue_id","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "venue_obligations_venue_obligation_idx" ON "venue_obligations" USING btree ("venue_id","obligation_id");