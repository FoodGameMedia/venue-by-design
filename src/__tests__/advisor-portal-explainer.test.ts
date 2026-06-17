import { describe, it, expect } from "vitest";
import { isAdvisorPortalLogin } from "@/components/advisor/advisor-portal-explainer";

describe("advisor portal login", () => {
  it("detects advisor portal redirect paths", () => {
    expect(isAdvisorPortalLogin("/advisor")).toBe(true);
    expect(isAdvisorPortalLogin("/advisor/onboarding")).toBe(true);
    expect(isAdvisorPortalLogin("/dashboard")).toBe(false);
    expect(isAdvisorPortalLogin("/login")).toBe(false);
  });
});
