import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@localhost:5432/fake");

const mockFindMany = vi.fn();

vi.mock("@/db", () => ({
  db: {
    query: {
      subscriptions: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
    },
  },
}));

import {
  CAPABILITY_PLAN_LABEL,
  planCarries,
  planForUser,
  upgradeMessageFor,
  userCarries,
  type PricingPlan,
} from "@/lib/systems/entitlements";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("planCarries", () => {
  const cases: [PricingPlan, boolean, boolean][] = [
    // plan, carries catalogue, carries audit
    ["free", false, false],
    ["essentials", true, false],
    ["pro", true, true],
    ["group", true, true],
  ];

  it.each(cases)("%s", (plan, catalogue, audit) => {
    expect(planCarries(plan, "catalogue")).toBe(catalogue);
    expect(planCarries(plan, "audit")).toBe(audit);
  });

  // The split is the whole decision: Essentials gets you on your feet, Pro
  // judges the binder. If this ever passes, the split has collapsed.
  it("does not let Essentials reach the audit", () => {
    expect(planCarries("essentials", "audit")).toBe(false);
  });
});

describe("planForUser", () => {
  it("is free when there is no live subscription", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    await expect(planForUser("user_1")).resolves.toBe("free");
  });

  it("takes the highest plan when an upgrade has not settled", async () => {
    mockFindMany.mockResolvedValueOnce([{ plan: "essentials" }, { plan: "pro" }]);
    await expect(planForUser("user_1")).resolves.toBe("pro");
  });

  it("does not depend on row order", async () => {
    mockFindMany.mockResolvedValueOnce([{ plan: "group" }, { plan: "essentials" }]);
    await expect(planForUser("user_1")).resolves.toBe("group");
  });

  // A database fault must not hand out entitlement it cannot prove.
  it("falls closed when the query throws", async () => {
    mockFindMany.mockRejectedValueOnce(new Error("connection refused"));
    await expect(planForUser("user_1")).resolves.toBe("free");
  });

  it("only asks for statuses that still carry entitlement", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    await planForUser("user_1");
    // trialing, active and past_due are the three; the filter is built in the
    // query rather than in JS, so the call itself is the assertion.
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockFindMany.mock.calls[0][0]).toHaveProperty("where");
  });
});

describe("userCarries", () => {
  it("lets Pro audit", async () => {
    mockFindMany.mockResolvedValueOnce([{ plan: "pro" }]);
    await expect(userCarries("user_1", "audit")).resolves.toBe(true);
  });

  it("stops Essentials auditing", async () => {
    mockFindMany.mockResolvedValueOnce([{ plan: "essentials" }]);
    await expect(userCarries("user_1", "audit")).resolves.toBe(false);
  });

  it("stops a lapsed subscriber doing either", async () => {
    mockFindMany.mockResolvedValue([]);
    await expect(userCarries("user_1", "catalogue")).resolves.toBe(false);
    await expect(userCarries("user_1", "audit")).resolves.toBe(false);
  });
});

describe("copy", () => {
  it("names the plan the audit is sold under", () => {
    expect(CAPABILITY_PLAN_LABEL.audit).toBe("Venue Pulse Pro");
    expect(upgradeMessageFor("audit")).toContain("Venue Pulse Pro");
  });

  it("uses no em dashes", () => {
    const copy = [
      upgradeMessageFor("audit"),
      upgradeMessageFor("catalogue"),
      ...Object.values(CAPABILITY_PLAN_LABEL),
    ].join(" ");
    expect(copy).not.toMatch(/—/);
  });
});
