import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@localhost:5432/fake");

const mockAdvisorFindFirst = vi.fn();
const mockInsertReturning = vi.fn();
const mockInsertValues = vi.fn(() => ({ returning: mockInsertReturning }));
const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

vi.mock("@/db", () => ({
  db: {
    query: {
      advisorAccounts: { findFirst: (...args: unknown[]) => mockAdvisorFindFirst(...args) },
    },
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

import {
  getAdvisorByAuthId,
  isApprovedAdvisor,
  createAdvisorAccount,
} from "@/lib/advisor";
import { advisorAccounts } from "@/db/schema";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAdvisorByAuthId", () => {
  it("returns the advisor account when found", async () => {
    mockAdvisorFindFirst.mockResolvedValueOnce({
      id: "adv_1",
      authId: "auth_1",
      email: "a@b.com",
      businessName: "Acme Advisory",
      status: "approved",
    });

    const account = await getAdvisorByAuthId("auth_1");
    expect(account?.id).toBe("adv_1");
    expect(account?.businessName).toBe("Acme Advisory");
  });

  it("returns null when no account exists", async () => {
    mockAdvisorFindFirst.mockResolvedValueOnce(undefined);
    const account = await getAdvisorByAuthId("auth_missing");
    expect(account).toBeNull();
  });
});

describe("isApprovedAdvisor", () => {
  it("returns true only for approved advisors", async () => {
    mockAdvisorFindFirst.mockResolvedValueOnce({ id: "adv_1", status: "approved" });
    await expect(isApprovedAdvisor("auth_1")).resolves.toBe(true);
  });

  it("returns false for pending advisors", async () => {
    mockAdvisorFindFirst.mockResolvedValueOnce({ id: "adv_1", status: "pending" });
    await expect(isApprovedAdvisor("auth_1")).resolves.toBe(false);
  });

  it("returns false for rejected advisors", async () => {
    mockAdvisorFindFirst.mockResolvedValueOnce({ id: "adv_1", status: "rejected" });
    await expect(isApprovedAdvisor("auth_1")).resolves.toBe(false);
  });

  it("returns false when no advisor account exists", async () => {
    mockAdvisorFindFirst.mockResolvedValueOnce(undefined);
    await expect(isApprovedAdvisor("auth_x")).resolves.toBe(false);
  });
});

describe("createAdvisorAccount", () => {
  it("creates a pending advisor account", async () => {
    mockAdvisorFindFirst.mockResolvedValueOnce(undefined); // no existing
    mockInsertReturning.mockResolvedValueOnce([
      {
        id: "adv_new",
        authId: "auth_2",
        email: "new@advisor.com",
        businessName: "New Advisory",
        status: "pending",
      },
    ]);

    const account = await createAdvisorAccount({
      authId: "auth_2",
      email: "new@advisor.com",
      businessName: "New Advisory",
    });

    expect(mockInsert).toHaveBeenCalledWith(advisorAccounts);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: "auth_2",
        email: "new@advisor.com",
        businessName: "New Advisory",
        status: "pending",
      })
    );
    expect(account.status).toBe("pending");
  });

  it("throws when an account already exists for this auth id", async () => {
    mockAdvisorFindFirst.mockResolvedValueOnce({ id: "adv_existing", status: "approved" });

    await expect(
      createAdvisorAccount({
        authId: "auth_2",
        email: "dup@advisor.com",
        businessName: "Dup",
      })
    ).rejects.toThrow("Advisor account already exists");

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
