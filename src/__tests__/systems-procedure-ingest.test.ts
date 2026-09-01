import { describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import {
  DOCX_MIME,
  IngestError,
  MAX_FILE_BYTES,
  MAX_IMAGES,
  assertIngestable,
  ingestFiles,
  ingestText,
  methodForMimeType,
  type IngestFile,
} from "@/lib/systems/procedure-ingest";

function file(name: string, mimeType: string, size = 1024): IngestFile {
  return { name, mimeType, bytes: new Uint8Array(size).fill(65) };
}

describe("methodForMimeType", () => {
  it("maps the types we accept", () => {
    expect(methodForMimeType(DOCX_MIME)).toBe("docx");
    expect(methodForMimeType("application/pdf")).toBe("pdf");
    expect(methodForMimeType("image/jpeg")).toBe("image");
    expect(methodForMimeType("image/png")).toBe("image");
    expect(methodForMimeType("image/webp")).toBe("image");
    expect(methodForMimeType("text/plain")).toBe("text");
  });

  it("rejects anything else", () => {
    expect(methodForMimeType("application/zip")).toBeNull();
    expect(methodForMimeType("image/heic")).toBeNull();
  });
});

describe("assertIngestable", () => {
  it("accepts a single document", () => {
    expect(assertIngestable([file("sop.pdf", "application/pdf")])).toBe("pdf");
  });

  it("accepts up to five photos", () => {
    const photos = Array.from({ length: MAX_IMAGES }, (_, i) => file(`p${i}.jpg`, "image/jpeg"));
    expect(assertIngestable(photos)).toBe("image");
  });

  it("rejects a sixth photo", () => {
    const photos = Array.from({ length: MAX_IMAGES + 1 }, (_, i) => file(`p${i}.jpg`, "image/jpeg"));
    expect(() => assertIngestable(photos)).toThrow(IngestError);
  });

  it("rejects two documents at once", () => {
    expect(() =>
      assertIngestable([file("a.pdf", "application/pdf"), file("b.pdf", "application/pdf")])
    ).toThrow(/one document at a time/);
  });

  it("rejects a mixed upload", () => {
    expect(() =>
      assertIngestable([file("a.pdf", "application/pdf"), file("b.jpg", "image/jpeg")])
    ).toThrow(/one kind of file/);
  });

  it("rejects an empty upload", () => {
    expect(() => assertIngestable([])).toThrow(/No file/);
  });

  it("rejects an empty file", () => {
    expect(() => assertIngestable([file("a.pdf", "application/pdf", 0)])).toThrow(/is empty/);
  });

  it("rejects a file over 10MB", () => {
    expect(() =>
      assertIngestable([file("big.pdf", "application/pdf", MAX_FILE_BYTES + 1)])
    ).toThrow(/larger than 10MB/);
  });

  it("rejects an unreadable type by name", () => {
    expect(() => assertIngestable([file("sop.pages", "application/zip")])).toThrow(/sop.pages/);
  });
});

describe("ingestText", () => {
  it("trims and records the method", () => {
    const result = ingestText("   The Friday handover runs at four o'clock sharp.   ");
    expect(result.body).toBe("The Friday handover runs at four o'clock sharp.");
    expect(result.extractedFrom.method).toBe("text");
    expect(result.extractedFrom.fileNames).toEqual([]);
  });

  it("rejects something too short to audit", () => {
    expect(() => ingestText("handover")).toThrow(/too short/);
  });
});

describe("ingestFiles", () => {
  function clientReturning(text: string) {
    const create = vi.fn().mockResolvedValue({ content: [{ type: "text", text }] });
    return { client: { messages: { create } } as unknown as Anthropic, create };
  }

  it("sends a pdf as a document block", async () => {
    const { client, create } = clientReturning("1. Walk the pass.\n2. Read the book.");
    const result = await ingestFiles([file("sop.pdf", "application/pdf")], client);

    expect(result.body).toContain("Walk the pass");
    expect(result.extractedFrom.method).toBe("pdf");

    const blocks = create.mock.calls[0][0].messages[0].content;
    expect(blocks[0].type).toBe("document");
    expect(blocks[0].source.media_type).toBe("application/pdf");
  });

  it("sends photos as image blocks and counts them", async () => {
    const { client, create } = clientReturning("Laminated card, step one.");
    const photos = [file("a.jpg", "image/jpeg"), file("b.png", "image/png")];
    const result = await ingestFiles(photos, client);

    expect(result.extractedFrom.method).toBe("image");
    expect(result.extractedFrom.imageCount).toBe(2);

    const blocks = create.mock.calls[0][0].messages[0].content;
    expect(blocks.filter((b: { type: string }) => b.type === "image")).toHaveLength(2);
    expect(blocks[0].source.media_type).toBe("image/jpeg");
    expect(blocks[1].source.media_type).toBe("image/png");
  });

  it("surfaces an unreadable file as a plain message", async () => {
    const { client } = clientReturning("UNREADABLE");
    await expect(ingestFiles([file("blurry.jpg", "image/jpeg")], client)).rejects.toThrow(
      /clearer photo/
    );
  });

  it("reads a plain text upload without calling the model", async () => {
    const bytes = new TextEncoder().encode("The delivery window is agreed at 2pm daily.");
    const { client, create } = clientReturning("should not be used");
    const result = await ingestFiles(
      [{ name: "sop.txt", mimeType: "text/plain", bytes }],
      client
    );

    expect(result.body).toBe("The delivery window is agreed at 2pm daily.");
    expect(create).not.toHaveBeenCalled();
  });

  it("totals the bytes it ingested", async () => {
    const { client } = clientReturning("Step one.");
    const result = await ingestFiles(
      [file("a.jpg", "image/jpeg", 100), file("b.jpg", "image/jpeg", 250)],
      client
    );
    expect(result.extractedFrom.byteCount).toBe(350);
  });
});
