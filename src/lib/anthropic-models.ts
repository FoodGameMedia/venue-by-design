/** Current Anthropic model IDs (see platform.claude.com/docs/en/about-claude/model-deprecations). */
export const ANTHROPIC_MODELS = {
  /** Default for chat, prescriptions, and other Sonnet workloads. */
  sonnet: "claude-sonnet-4-6",
  /** Deep diagnostic reports. */
  opus: "claude-opus-4-8",
} as const;

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
