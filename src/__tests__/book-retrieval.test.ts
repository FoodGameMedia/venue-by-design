import { describe, it, expect } from "vitest";
import {
  extractQueryKeywords,
  formatBookExcerpts,
  scoreChunksByKeywords,
  type BookChunkRow,
} from "@/lib/book-retrieval";

const sampleChunks: BookChunkRow[] = [
  {
    bookId: "the-calm-venue",
    chapter: "Throughput",
    content: "Throughput is how orders move through the pass under pressure without chaos.",
    sourcePath: "the-calm-venue/throughput.md",
    chunkIndex: 0,
  },
  {
    bookId: "the-food-game",
    chapter: "Defaults",
    content: "Defaults are the unwritten rules staff fall back to when things get busy.",
    sourcePath: "the-food-game/defaults.md",
    chunkIndex: 0,
  },
  {
    bookId: "the-calm-venue",
    chapter: "People load",
    content: "People load tracks emotional labour and recovery between services.",
    sourcePath: "the-calm-venue/people-load.md",
    chunkIndex: 0,
  },
];

describe("extractQueryKeywords", () => {
  it("removes stop words and short tokens", () => {
    expect(extractQueryKeywords("What is throughput under pressure?")).toEqual([
      "throughput",
      "under",
      "pressure",
    ]);
  });
});

describe("scoreChunksByKeywords", () => {
  it("ranks chunks by keyword overlap", () => {
    const results = scoreChunksByKeywords(sampleChunks, "throughput under pressure");
    expect(results[0]?.chapter).toBe("Throughput");
    expect(results[0]?.bookId).toBe("the-calm-venue");
  });

  it("returns empty when no keywords match", () => {
    expect(scoreChunksByKeywords(sampleChunks, "the a an")).toEqual([]);
  });
});

describe("formatBookExcerpts", () => {
  it("returns empty string when no excerpts", () => {
    expect(formatBookExcerpts([])).toBe("");
  });

  it("formats excerpts with book and chapter headers", () => {
    const formatted = formatBookExcerpts([
      {
        bookId: "the-calm-venue",
        chapter: "Throughput",
        content: "Orders should flow calmly.",
      },
    ]);

    expect(formatted).toContain("Book excerpts");
    expect(formatted).toContain("The Calm Venue — Throughput");
    expect(formatted).toContain("Orders should flow calmly.");
    expect(formatted).toContain("cite chapter");
  });
});
