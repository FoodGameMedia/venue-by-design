/** Current Anthropic model IDs (see platform.claude.com/docs/en/about-claude/model-deprecations). */
export const ANTHROPIC_MODELS = {
  /** Default for chat, prescriptions, and other Sonnet workloads. */
  sonnet: "claude-sonnet-4-6",
  /** Deep diagnostic reports. */
  opus: "claude-opus-4-8",
} as const;

export function isAnthropicApiKeyConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function anthropicErrorDetails(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") return {};

  const err = error as {
    status?: number;
    message?: string;
    error?: { type?: string; error?: { type?: string; message?: string } };
  };

  return {
    anthropicStatus: err.status,
    anthropicErrorType: err.error?.error?.type ?? err.error?.type,
    anthropicErrorMessage: err.error?.error?.message ?? err.message,
  };
}

export function isAnthropicModelNotFoundError(error: unknown): boolean {
  const details = anthropicErrorDetails(error);
  if (details.anthropicStatus === 404) return true;
  if (details.anthropicErrorType === "not_found_error") return true;
  const message = details.anthropicErrorMessage;
  return typeof message === "string" && message.includes("model:");
}

export type ChatApiErrorCode =
  | "CHAT_UNAVAILABLE"
  | "ANTHROPIC_NOT_CONFIGURED"
  | "ANTHROPIC_MODEL_NOT_FOUND";

const CHAT_UNAVAILABLE_MESSAGE =
  "Unable to generate a response right now. Please try again.";

export function chatApiErrorPayload(error?: unknown): {
  error: string;
  code: ChatApiErrorCode;
} {
  if (error && isAnthropicModelNotFoundError(error)) {
    return {
      error: CHAT_UNAVAILABLE_MESSAGE,
      code: "ANTHROPIC_MODEL_NOT_FOUND",
    };
  }

  if (!isAnthropicApiKeyConfigured()) {
    return {
      error: CHAT_UNAVAILABLE_MESSAGE,
      code: "ANTHROPIC_NOT_CONFIGURED",
    };
  }

  return {
    error: CHAT_UNAVAILABLE_MESSAGE,
    code: "CHAT_UNAVAILABLE",
  };
}
