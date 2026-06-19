/** Target chunk size for book manuscript ingestion (~800–1200 chars with overlap). */
export const CHUNK_TARGET = 1000;
export const CHUNK_MIN = 800;
export const CHUNK_MAX = 1200;
export const CHUNK_OVERLAP = 200;

export interface ParsedBookFile {
  bookId: string;
  chapter: string;
  sourcePath: string;
  content: string;
}

/** Split manuscript text into overlapping chunks, preferring paragraph and sentence breaks. */
export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= CHUNK_MAX) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + CHUNK_TARGET, normalized.length);

    if (end < normalized.length) {
      const paraBreak = normalized.lastIndexOf("\n\n", end);
      if (paraBreak > start + CHUNK_MIN) {
        end = paraBreak;
      } else {
        const sentenceBreak = normalized.lastIndexOf(". ", end);
        if (sentenceBreak > start + CHUNK_MIN) {
          end = sentenceBreak + 1;
        }
      }
    }

    const slice = normalized.slice(start, end).trim();
    if (slice) chunks.push(slice);

    if (end >= normalized.length) break;
    start = Math.max(start + 1, end - CHUNK_OVERLAP);
  }

  return chunks;
}

/** Derive chapter label from filename or first markdown heading. */
export function deriveChapterLabel(filename: string, content: string): string {
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading?.[1]?.trim()) return heading[1].trim();
  return filename.replace(/\.(md|txt)$/i, "").replace(/[-_]/g, " ");
}

/** Parse relative path under content/books into book id and chapter metadata. */
export function parseBookFilePath(relativePath: string, content: string): ParsedBookFile {
  const parts = relativePath.split(/[/\\]/).filter(Boolean);
  const bookId = parts.length > 1 ? parts[0] : "general";
  const filename = parts[parts.length - 1] ?? relativePath;
  const chapter = deriveChapterLabel(filename, content);

  return {
    bookId,
    chapter,
    sourcePath: relativePath.replace(/\\/g, "/"),
    content,
  };
}
