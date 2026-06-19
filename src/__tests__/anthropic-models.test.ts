import { describe, expect, it } from "vitest";
import {
  ANTHROPIC_MODELS,
  chatApiErrorPayload,
  isAnthropicAuthError,
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

  it("detects Anthropic auth errors", () => {
    const error = {
      status: 401,
      error: {
        type: "error",
        error: { type: "authentication_error", message: "invalid x-api-key" },
      },
    };
    expect(isAnthropicAuthError(error)).toBe(true);
    expect(chatApiErrorPayload(error).code).toBe("ANTHROPIC_AUTH_ERROR");
  });
});
