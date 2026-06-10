CREATE TYPE "public"."advisor_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "advisor_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" text NOT NULL,
	"email" text NOT NULL,
	"business_name" text NOT NULL,
	"status" "advisor_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "advisor_accounts_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "advisor_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "advisor_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advisor_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "advisor_clients" ADD CONSTRAINT "advisor_clients_advisor_id_advisor_accounts_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisor_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_clients" ADD CONSTRAINT "advisor_clients_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;