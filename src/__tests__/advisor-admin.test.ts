import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@localhost:5432/fake");

const mockReturning = vi.fn();
const mockWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

vi.mock("@/db", () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

async function getPost() {
  const mod = await import("@/app/api/advisor/admin/route");
  return mod.POST;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ADVISOR_ADMIN_TOKEN", "token_123");
});

describe("POST /api/advisor/admin", () => {
  it("rejects requests without the admin token", async () => {
    const POST = await getPost();
    const res = await POST(
      new Request("http://localhost/api/advisor/admin", {
        method: "POST",
        body: JSON.stringify({ email: "advisor@example.com", status: "approved" }),
      })
    );

    expect(res.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates an advisor account status", async () => {
    mockReturning.mockResolvedValueOnce([
      {
        id: "adv_1",
        email: "advisor@example.com",
        businessName: "Acme Advisory",
        status: "approved",
      },
    ]);

    const POST = await getPost();
    const res = await POST(
      new Request("http://localhost/api/advisor/admin", {
        method: "POST",
        headers: {
          "x-advisor-admin-token": "token_123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "advisor@example.com", status: "approved" }),
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.account.status).toBe("approved");
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved", updatedAt: expect.any(Date) })
    );
  });

  it("rejects invalid statuses", async () => {
    const POST = await getPost();
    const res = await POST(
      new Request("http://localhost/api/advisor/admin", {
        method: "POST",
        headers: {
          "x-advisor-admin-token": "token_123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "advisor@example.com", status: "invalid" }),
      })
    );

    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the account is not found", async () => {
    mockReturning.mockResolvedValueOnce([]);

    const POST = await getPost();
    const res = await POST(
      new Request("http://localhost/api/advisor/admin", {
        method: "POST",
        headers: {
          "x-advisor-admin-token": "token_123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "missing@example.com", status: "rejected" }),
      })
    );

    expect(res.status).toBe(404);
  });
});
