import { describe, it, expect } from "vitest";
import { isAuthExemptPath } from "@/lib/supabase/middleware";

describe("isAuthExemptPath", () => {
  it("allows Stripe webhooks without login", () => {
    expect(isAuthExemptPath("/api/webhooks/stripe")).toBe(true);
  });

  it("allows cron routes without login", () => {
    expect(isAuthExemptPath("/api/cron/send-prescriptions")).toBe(true);
  });

  it("does not exempt authenticated API routes", () => {
    expect(isAuthExemptPath("/api/checkout/create-session")).toBe(false);
    expect(isAuthExemptPath("/api/billing/portal")).toBe(false);
  });

  it("does not exempt app pages", () => {
    expect(isAuthExemptPath("/dashboard")).toBe(false);
    expect(isAuthExemptPath("/login")).toBe(false);
  });
});
