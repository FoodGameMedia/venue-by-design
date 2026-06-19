# Book manuscripts for Ask advisor

This folder feeds the **Ask** chat with content from *The Calm Venue* and *The Food Game*. Manuscripts stay out of git — drop your files here locally, then run the ingestion script.

## Step 1 — Prepare your manuscripts

1. Export each book from Word or PDF to **plain text** or **Markdown** (`.md` or `.txt`).
2. Clean up formatting:
   - Remove page numbers, headers/footers, and repeated running titles.
   - Keep chapter headings as `# Chapter title` (Markdown) or plain text titles.
   - One file per chapter is easiest; a single whole-book file also works.
3. Aim for readable prose — the ingest script chunks at ~800–1200 characters with overlap.

**Suggested layout:**

```
content/books/
  the-calm-venue/
    01-introduction.md
    02-throughput.md
    ...
  the-food-game/
    01-why-the-food-game.md
    02-defaults-and-signals.md
    ...
```

Folder name becomes the **book id** (`the-calm-venue`, `the-food-game`). Filename (or first `# heading`) becomes the **chapter** label in citations.

## Step 2 — Drop files here

Create the book folders and copy your cleaned files:

```bash
mkdir -p content/books/the-calm-venue content/books/the-food-game
# Copy your .md or .txt files into those folders
```

Do **not** commit manuscript files if they are copyrighted — add them to `.gitignore` if needed.

## Step 3 — Apply the database migration (once)

Ensure `DATABASE_URL` is set in `.env.local`, then either:

```bash
npm run db:migrate
```

or, if migrate doesn't pick up the new table:

```bash
npx tsx scripts/apply-book-chunks-migration.ts
```

This creates the `book_chunks` table with Postgres **full-text search** (tsvector). No OpenAI key required for v1.

## Step 4 — Run ingestion

```bash
npm run books:ingest
```

The script is **idempotent**: re-run anytime after editing manuscripts. It replaces chunks per file and removes stale entries.

## Step 5 — Verify retrieval

1. Start the app: `npm run dev`
2. Log in with a venue that has check-ins (or complete one).
3. Open **Ask** (bottom-right FAB) and ask something book-specific, e.g.:
   - "What does the method say about throughput under pressure?"
   - "How should I think about defaults and signals?"
4. Answers should reference book content and cite the chapter when possible.

**Quick DB check** (optional):

```bash
npx tsx -e "
import 'dotenv/config'; import { config } from 'dotenv'; config({ path: '.env.local', override: true });
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
const rows = await sql\`SELECT book_id, chapter, left(content, 80) AS preview FROM book_chunks LIMIT 5\`;
console.table(rows);
await sql.end();
"
```

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Postgres connection for chunk storage |
| `ANTHROPIC_API_KEY` | Yes (for Ask chat) | Claude responses in `/api/chat` |
| `OPENAI_API_KEY` | No (v1) | Reserved for future vector embeddings upgrade |

## Upgrade path (pgvector + embeddings)

v1 uses **keyword / tsvector** retrieval — good enough to ship today. To upgrade later:

1. Enable `pgvector` on Supabase and add an `embedding vector(1536)` column.
2. Set `OPENAI_API_KEY` and extend `scripts/ingest-books.ts` to embed each chunk.
3. Switch `retrieveBookChunks` in `src/lib/book-retrieval.ts` to cosine similarity search.

The ingest script and schema are designed so you can add embeddings without changing the manuscript folder layout.
