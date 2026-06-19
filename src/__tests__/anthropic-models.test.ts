import { describe, expect, it } from "vitest";
import {
  ANTHROPIC_MODELS,
  chatApiErrorPayload,
  isAnthropicModelNotFoundError,
} from "@/lib/anthropic-models";

describe("anthropic-models", () => {
  it("uses a current Sonnet model id", () => {
    expect(ANTHROPIC_MODELS.sonnet).toBe("claude-sonnet-4-6");
  });

  it("detects Anthropic model not found errors", () => {
    const error = {
      status: 404,
      error: {
        type: "error",
        error: { type: "not_found_error", message: "model: claude-sonnet-4-20250514" },
      },
    };
    expect(isAnthropicModelNotFoundError(error)).toBe(true);
    expect(chatApiErrorPayload(error).code).toBe("ANTHROPIC_MODEL_NOT_FOUND");
  });
});
