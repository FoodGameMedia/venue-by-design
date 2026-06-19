import { describe, it, expect } from "vitest";
import { isAuthExemptPath } from "@/lib/supabase/middleware";

describe("isAuthExemptPath", () => {
  it("allows Stripe webhooks without session auth", () => {
    expect(isAuthExemptPath("/api/webhooks/stripe")).toBe(true);
  });

  it("allows cron routes without session auth", () => {
    expect(isAuthExemptPath("/api/cron/send-prescriptions")).toBe(true);
  });

  it("does not exempt other API routes", () => {
    expect(isAuthExemptPath("/api/checkout/create-session")).toBe(false);
    expect(isAuthExemptPath("/api/billing/portal")).toBe(false);
  });
});
