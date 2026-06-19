import { ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookChunks } from "@/db/schema";

export interface BookExcerpt {
  bookId: string;
  chapter: string;
  content: string;
}

export interface BookChunkRow {
  bookId: string;
  chapter: string;
  content: string;
  sourcePath: string;
  chunkIndex: number;
}

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 8;

/** Format retrieved chunks for injection into the advisor system prompt. */
export function formatBookExcerpts(excerpts: BookExcerpt[]): string {
  if (!excerpts.length) return "";

  const blocks = excerpts.map(
    (e) =>
      `### ${humanizeBookId(e.bookId)} — ${e.chapter}\n${e.content.trim()}`
  );

  return `
## Book excerpts (use these — cite chapter when possible)

${blocks.join("\n\n")}
`.trim();
}

function humanizeBookId(bookId: string): string {
  return bookId
    .split(/[-_]/g)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Extract significant keywords for fallback matching when FTS returns nothing. */
export function extractQueryKeywords(query: string): string[] {
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "i", "me", "my", "we", "our", "you", "your", "it", "its", "this", "that",
    "what", "how", "why", "when", "where", "who", "can", "about", "with",
  ]);

  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

/** Score chunks by keyword overlap — used in tests and as FTS fallback. */
export function scoreChunksByKeywords(
  chunks: BookChunkRow[],
  query: string
): BookExcerpt[] {
  const keywords = extractQueryKeywords(query);
  if (!keywords.length) return [];

  const scored = chunks
    .map((chunk) => {
      const lower = chunk.content.toLowerCase();
      const score = keywords.reduce(
        (sum, kw) => sum + (lower.includes(kw) ? 1 : 0),
        0
      );
      return { chunk, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_LIMIT).map(({ chunk }) => ({
    bookId: chunk.bookId,
    chapter: chunk.chapter,
    content: chunk.content,
  }));
}

async function retrieveViaFullTextSearch(
  query: string,
  limit: number
): Promise<BookExcerpt[]> {
  const rows = await db.execute<{
    book_id: string;
    chapter: string;
    content: string;
    rank: number;
  }>(sql`
    SELECT
      book_id,
      chapter,
      content,
      ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${query})) AS rank
    FROM book_chunks
    WHERE to_tsvector('english', content) @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT ${limit}
  `);

  return rows.map((r) => ({
    bookId: r.book_id,
    chapter: r.chapter,
    content: r.content,
  }));
}

async function retrieveViaKeywordFallback(
  query: string,
  limit: number
): Promise<BookExcerpt[]> {
  const keywords = extractQueryKeywords(query);
  if (!keywords.length) return [];

  const keywordMatches = keywords.map((kw) => ilike(bookChunks.content, `%${kw}%`));
  const candidateLimit = Math.min(limit * 8, 48);

  const candidates = await db
    .select({
      bookId: bookChunks.bookId,
      chapter: bookChunks.chapter,
      content: bookChunks.content,
      sourcePath: bookChunks.sourcePath,
      chunkIndex: bookChunks.chunkIndex,
    })
    .from(bookChunks)
    .where(or(...keywordMatches))
    .limit(candidateLimit);

  return scoreChunksByKeywords(candidates, query).slice(0, limit);
}

/**
 * Retrieve top relevant book chunks for a user message.
 * Uses Postgres full-text search (tsvector); falls back to keyword overlap.
 */
export async function retrieveBookChunks(
  query: string,
  limit = DEFAULT_LIMIT
): Promise<BookExcerpt[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

  try {
    const ftsResults = await retrieveViaFullTextSearch(trimmed, safeLimit);
    if (ftsResults.length > 0) return ftsResults;

    return await retrieveViaKeywordFallback(trimmed, safeLimit);
  } catch {
    try {
      return await retrieveViaKeywordFallback(trimmed, safeLimit);
    } catch {
      return [];
    }
  }
}
