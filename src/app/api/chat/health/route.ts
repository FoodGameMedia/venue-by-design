import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  ANTHROPIC_MODELS,
  anthropicErrorDetails,
  createAnthropicClient,
  getAnthropicApiKey,
  isAnthropicApiKeyConfigured,
} from "@/lib/anthropic-models";

export const maxDuration = 30;

/** Auth-required probe for Anthropic config/reachability in production. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keyLength = getAnthropicApiKey()?.length ?? 0;
  if (!isAnthropicApiKeyConfigured()) {
    return NextResponse.json({
      ok: false,
      code: "ANTHROPIC_NOT_CONFIGURED",
      keyLength: 0,
    });
  }

  try {
    const anthropic = createAnthropicClient({ timeout: 15_000 });
    await anthropic.messages.create({
      model: ANTHROPIC_MODELS.sonnet,
      max_tokens: 8,
      messages: [{ role: "user", content: "Reply with OK only." }],
    });
    return NextResponse.json({
      ok: true,
      model: ANTHROPIC_MODELS.sonnet,
      keyLength,
    });
  } catch (error) {
    const details = anthropicErrorDetails(error);
    return NextResponse.json({
      ok: false,
      code: "ANTHROPIC_UNREACHABLE",
      keyLength,
      ...details,
    });
  }
}
