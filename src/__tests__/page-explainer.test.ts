import { describe, it, expect } from "vitest";
import { PAGE_EXPLAINERS } from "@/components/page-explainer";

const KEYS = Object.keys(PAGE_EXPLAINERS) as (keyof typeof PAGE_EXPLAINERS)[];

describe("page explainers", () => {
  it("covers every page that has one", () => {
    expect(KEYS).toEqual(
      expect.arrayContaining(["thisWeek", "domains", "systems", "myPlan"])
    );
  });

  it.each(KEYS)("defines copy for %s", (key) => {
    const explainer = PAGE_EXPLAINERS[key];
    expect(explainer.label.length).toBeGreaterThan(0);
    expect(explainer.heading.length).toBeGreaterThan(0);
    expect(explainer.why.length).toBeGreaterThan(0);
    expect(explainer.how.length).toBeGreaterThan(0);
    expect(explainer.testId).toMatch(/-explainer$/);
  });

  // The heading was previously outside this check, which is how em dashes
  // survived in it.
  it.each(KEYS)("uses no em dashes in %s", (key) => {
    const explainer = PAGE_EXPLAINERS[key];
    const copy = [explainer.heading, ...explainer.why, ...explainer.how].join(" ");
    expect(copy).not.toMatch(/—/);
  });

  it("gives every explainer a distinct testId", () => {
    const ids = KEYS.map((k) => PAGE_EXPLAINERS[k].testId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
