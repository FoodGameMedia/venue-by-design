import { describe, it, expect } from "vitest";
import {
  CHUNK_MAX,
  CHUNK_OVERLAP,
  CHUNK_TARGET,
  chunkText,
  deriveChapterLabel,
  parseBookFilePath,
} from "@/lib/book-chunks";

describe("chunkText", () => {
  it("returns empty array for blank input", () => {
    expect(chunkText("   ")).toEqual([]);
  });

  it("returns single chunk when text fits within max size", () => {
    const text = "Short chapter content.";
    expect(chunkText(text)).toEqual([text]);
  });

  it("splits long text into overlapping chunks", () => {
    const paragraph = "A".repeat(500);
    const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}`;
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(CHUNK_MAX + 100);
    }

    const combinedUnique = new Set(chunks.join("")).size;
    expect(combinedUnique).toBeGreaterThan(0);
  });

  it("splits long text at paragraph boundaries when possible", () => {
    const partA = "Word ".repeat(200).trim();
    const partB = "Term ".repeat(200).trim();
    const text = `${partA}\n\n${partB}`;
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0]).toContain("Word");
  });

  it("uses overlap between consecutive chunks", () => {
    const text = "Sentence. ".repeat(300);
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(CHUNK_TARGET).toBe(1000);
    expect(CHUNK_OVERLAP).toBe(200);
  });
});

describe("deriveChapterLabel", () => {
  it("uses first markdown heading when present", () => {
    const content = "# Throughput under pressure\n\nBody text.";
    expect(deriveChapterLabel("01-throughput.md", content)).toBe("Throughput under pressure");
  });

  it("falls back to filename without extension", () => {
    expect(deriveChapterLabel("02-defaults-and-signals.md", "No heading here.")).toBe(
      "02 defaults and signals"
    );
  });
});

describe("parseBookFilePath", () => {
  it("derives book id from folder name", () => {
    const parsed = parseBookFilePath(
      "the-calm-venue/01-intro.md",
      "# Introduction\n\nWelcome."
    );
    expect(parsed.bookId).toBe("the-calm-venue");
    expect(parsed.chapter).toBe("Introduction");
    expect(parsed.sourcePath).toBe("the-calm-venue/01-intro.md");
  });
});
