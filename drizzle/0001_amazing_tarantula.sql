CREATE TYPE "public"."venue_type" AS ENUM('restaurant', 'cafe', 'bar', 'pub', 'hotel_fb', 'large_format');--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "venue_type" "venue_type";--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "staff_count" integer;