import { describe, it, expect } from "vitest";
import { PAGE_EXPLAINERS } from "@/components/page-explainer";

describe("page explainers", () => {
  it("defines copy for dashboard, domains, and my plan", () => {
    for (const key of ["thisWeek", "domains", "myPlan"] as const) {
      const explainer = PAGE_EXPLAINERS[key];
      expect(explainer.label.length).toBeGreaterThan(0);
      expect(explainer.heading.length).toBeGreaterThan(0);
      expect(explainer.why.length).toBeGreaterThan(0);
      expect(explainer.how.length).toBeGreaterThan(0);
      expect(explainer.testId).toMatch(/-explainer$/);
      expect(`${explainer.why} ${explainer.how}`).not.toMatch(/—/);
    }
  });
});
