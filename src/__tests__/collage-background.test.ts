import { describe, expect, it } from "vitest";
import { getCollageVariant } from "@/lib/collage-background";

describe("getCollageVariant", () => {
  it("keeps home and pricing on v1 only", () => {
    expect(getCollageVariant("/")).toBe("v1");
    expect(getCollageVariant("/pricing")).toBe("v1");
  });

  it("alternates from login onward", () => {
    expect(getCollageVariant("/login")).toBe("v1");
    expect(getCollageVariant("/dashboard")).toBe("v2");
    expect(getCollageVariant("/score")).toBe("v1");
    expect(getCollageVariant("/domains")).toBe("v2");
    expect(getCollageVariant("/my-plan")).toBe("v1");
    expect(getCollageVariant("/checkin")).toBe("v2");
    expect(getCollageVariant("/diagnostic")).toBe("v1");
    expect(getCollageVariant("/onboarding")).toBe("v2");
  });

  it("matches nested advisor routes correctly", () => {
    expect(getCollageVariant("/advisor/onboarding")).toBe("v1");
    expect(getCollageVariant("/advisor")).toBe("v2");
  });

  it("defaults unknown routes to v1", () => {
    expect(getCollageVariant("/auth/callback")).toBe("v1");
  });
});
