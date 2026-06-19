CREATE TABLE "book_chunks" (
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
CREATE UNIQUE INDEX "book_chunks_source_chunk_idx" ON "book_chunks" USING btree ("source_path","chunk_index");
--> statement-breakpoint
CREATE INDEX "book_chunks_book_id_idx" ON "book_chunks" USING btree ("book_id");
--> statement-breakpoint
CREATE INDEX "book_chunks_content_fts_idx" ON "book_chunks" USING gin (to_tsvector('english', content));
