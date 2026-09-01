/**
 * Ingest: turn whatever the operator has into procedure text.
 *
 * Three doors, per the specification and decision D6.
 *  - Word .docx, extracted server-side with mammoth.
 *  - PDF, passed to Claude as a native document block, which reads scanned
 *    binders without an OCR stack.
 *  - Photographs of a binder page or a laminated card, as image blocks.
 * Pasted text and described shifts need no extraction at all.
 *
 * Everything lands as plain text, because `procedure_versions.body` holds text
 * whatever the source was.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_MODELS, createAnthropicClient } from "@/lib/anthropic-models";

import { MAX_FILE_BYTES, MAX_IMAGES } from "./limits";

export type IngestMethod = "docx" | "pdf" | "image" | "text";

export { MAX_FILE_BYTES, MAX_IMAGES };

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ImageMime = (typeof IMAGE_MIMES)[number];

export interface IngestFile {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
}

export interface IngestResult {
  body: string;
  extractedFrom: {
    method: IngestMethod;
    fileNames: string[];
    mimeTypes: string[];
    byteCount: number;
    imageCount?: number;
  };
}

export class IngestError extends Error {}

export function methodForMimeType(mimeType: string): IngestMethod | null {
  if (mimeType === DOCX_MIME) return "docx";
  if (mimeType === "application/pdf") return "pdf";
  if ((IMAGE_MIMES as readonly string[]).includes(mimeType)) return "image";
  if (mimeType === "text/plain" || mimeType === "text/markdown") return "text";
  return null;
}

/** Guards run before anything is stored or sent anywhere. */
export function assertIngestable(files: readonly IngestFile[]): IngestMethod {
  if (files.length === 0) {
    throw new IngestError("No file was uploaded.");
  }

  const methods = new Set<IngestMethod>();
  for (const file of files) {
    if (file.bytes.byteLength === 0) {
      throw new IngestError(`${file.name} is empty.`);
    }
    if (file.bytes.byteLength > MAX_FILE_BYTES) {
      throw new IngestError(`${file.name} is larger than 10MB.`);
    }
    const method = methodForMimeType(file.mimeType);
    if (!method) {
      throw new IngestError(
        `${file.name} is not a file type we can read. Use Word, PDF, or a photo.`
      );
    }
    methods.add(method);
  }

  if (methods.size > 1) {
    throw new IngestError("Upload one kind of file at a time.");
  }

  const method = [...methods][0];

  if (method === "image" && files.length > MAX_IMAGES) {
    throw new IngestError(`Upload at most ${MAX_IMAGES} photos for one procedure.`);
  }
  if (method !== "image" && files.length > 1) {
    throw new IngestError("Upload one document at a time.");
  }

  return method;
}

const EXTRACTION_SYSTEM_PROMPT = `You transcribe standard operating procedures for hospitality venues.

Return the procedure as plain text, faithfully. Keep the original wording, headings, numbered steps and any named owners, times or triggers. Preserve the order.

Do not summarise. Do not improve it. Do not add steps that are not there. Do not comment on its quality; something else does that job.

If the source contains more than one distinct procedure, transcribe them all and separate them with a line containing only "---".

If the image or document is unreadable, reply with exactly: UNREADABLE`;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

async function extractDocx(file: IngestFile): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({
    buffer: Buffer.from(file.bytes),
  });
  return value.trim();
}

async function extractWithClaude(
  files: readonly IngestFile[],
  method: "pdf" | "image",
  client?: Anthropic
): Promise<string> {
  const anthropic = client ?? createAnthropicClient();

  const blocks: Anthropic.ContentBlockParam[] = files.map((file) =>
    method === "pdf"
      ? {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: toBase64(file.bytes),
          },
        }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: file.mimeType as ImageMime,
            data: toBase64(file.bytes),
          },
        }
  );

  blocks.push({
    type: "text",
    text: "Transcribe the procedure shown above as plain text.",
  });

  const message = await anthropic.messages.create({
    model: ANTHROPIC_MODELS.sonnet,
    max_tokens: 4096,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: blocks }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new IngestError("Could not read that file.");
  }

  const text = textBlock.text.trim();
  if (!text || text === "UNREADABLE") {
    throw new IngestError(
      "Could not read that file. Try a clearer photo, or paste the text instead."
    );
  }
  return text;
}

/** Pasted text or a described shift. No extraction, only a guard. */
export function ingestText(body: string): IngestResult {
  const trimmed = body.trim();
  if (trimmed.length < 20) {
    throw new IngestError("That is too short to audit. Describe what actually happens.");
  }
  return {
    body: trimmed,
    extractedFrom: {
      method: "text",
      fileNames: [],
      mimeTypes: [],
      byteCount: Buffer.byteLength(trimmed, "utf8"),
    },
  };
}

export async function ingestFiles(
  files: readonly IngestFile[],
  client?: Anthropic
): Promise<IngestResult> {
  const method = assertIngestable(files);
  const byteCount = files.reduce((sum, f) => sum + f.bytes.byteLength, 0);

  let body: string;
  if (method === "docx") {
    body = await extractDocx(files[0]);
  } else if (method === "text") {
    body = Buffer.from(files[0].bytes).toString("utf8").trim();
  } else {
    body = await extractWithClaude(files, method, client);
  }

  if (!body) {
    throw new IngestError("That file had no readable text in it.");
  }

  return {
    body,
    extractedFrom: {
      method,
      fileNames: files.map((f) => f.name),
      mimeTypes: files.map((f) => f.mimeType),
      byteCount,
      ...(method === "image" ? { imageCount: files.length } : {}),
    },
  };
}
