/**
 * Ingest book manuscripts from content/books/** into Postgres for Ask advisor retrieval.
 * Run: npx tsx scripts/ingest-books.ts
 *
 * Requires DATABASE_URL. Idempotent — safe to re-run after adding or editing manuscripts.
 */
import "./load-env-local";

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { bookChunks } from "@/db/schema";
import { chunkText, parseBookFilePath } from "@/lib/book-chunks";

const BOOKS_ROOT = path.join(process.cwd(), "content", "books");
const TEXT_EXTENSIONS = new Set([".md", ".txt"]);

function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function walkTextFiles(dir: string, baseDir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".")) continue;
      files.push(...(await walkTextFiles(fullPath, baseDir)));
      continue;
    }
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    if (entry.name.toLowerCase() === "readme.md") continue;

    files.push(path.relative(baseDir, fullPath));
  }

  return files.sort();
}

async function ingestFile(relativePath: string): Promise<number> {
  const absolutePath = path.join(BOOKS_ROOT, relativePath);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = parseBookFilePath(relativePath, raw);
  const chunks = chunkText(parsed.content);

  await db.delete(bookChunks).where(eq(bookChunks.sourcePath, parsed.sourcePath));

  if (chunks.length === 0) {
    console.log(`  (skipped empty) ${parsed.sourcePath}`);
    return 0;
  }

  const now = new Date();
  await db.insert(bookChunks).values(
    chunks.map((content, chunkIndex) => ({
      bookId: parsed.bookId,
      chapter: parsed.chapter,
      content,
      contentHash: contentHash(content),
      sourcePath: parsed.sourcePath,
      chunkIndex,
      createdAt: now,
      updatedAt: now,
    }))
  );

  console.log(`  ${parsed.sourcePath} → ${chunks.length} chunk(s) [${parsed.bookId}]`);
  return chunks.length;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Set DATABASE_URL in .env.local");
    process.exit(1);
  }

  let files: string[];
  try {
    files = await walkTextFiles(BOOKS_ROOT, BOOKS_ROOT);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.error(`Books directory not found: ${BOOKS_ROOT}`);
      console.error("Create content/books/ and add manuscript files — see content/books/README.md");
      process.exit(1);
    }
    throw err;
  }

  if (files.length === 0) {
    console.log("No .md or .txt files found under content/books/");
    console.log("Add manuscripts to content/books/the-calm-venue/ or content/books/the-food-game/");
    process.exit(0);
  }

  console.log(`Ingesting ${files.length} file(s) from content/books/…`);

  let totalChunks = 0;
  const processedPaths: string[] = [];

  for (const file of files) {
    totalChunks += await ingestFile(file);
    processedPaths.push(file.replace(/\\/g, "/"));
  }

  if (processedPaths.length > 0) {
    await db
      .delete(bookChunks)
      .where(notInArray(bookChunks.sourcePath, processedPaths));
  } else {
    await db.delete(bookChunks);
  }

  console.log(`Done. ${totalChunks} chunk(s) indexed across ${files.length} file(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
