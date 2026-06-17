import { describe, it, expect } from "vitest";
import { SALES_TESTIMONIALS, hasSocialProof } from "@/lib/sales-social-proof";

describe("sales social proof", () => {
  it("is empty by default so the section stays hidden", () => {
    expect(SALES_TESTIMONIALS).toEqual([]);
    expect(hasSocialProof()).toBe(false);
  });
});
