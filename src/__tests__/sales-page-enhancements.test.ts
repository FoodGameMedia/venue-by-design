import { describe, it, expect } from "vitest";
import { DOMAIN_LABELS } from "@/lib/domains";

const SALES_DOMAIN_ORDER = [
  "throughput",
  "pacing",
  "defaults",
  "people_load",
  "signals",
  "endings",
  "operational_memory",
] as const;

describe("sales page domain icons", () => {
  it("lists all seven canonical domains", () => {
    expect(SALES_DOMAIN_ORDER).toHaveLength(7);
    for (const domain of SALES_DOMAIN_ORDER) {
      expect(DOMAIN_LABELS[domain]).toBeTruthy();
    }
  });
});
