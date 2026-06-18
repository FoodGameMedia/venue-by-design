import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
vi.stubEnv("STRIPE_PRICE_ESSENTIALS", "price_essentials");
vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
vi.stubEnv("STRIPE_PRICE_GROUP", "price_group");
vi.stubEnv("STRIPE_PRICE_DIAGNOSTIC_SOLO", "price_solo");
vi.stubEnv("STRIPE_PRICE_DIAGNOSTIC_STAFF", "price_staff");
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@localhost:5432/fake");

const mockFindFirst = vi.fn();
const mockUpdateSet = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: "user_1" }]) }) });

vi.mock("@/db", () => ({
  db: {
    query: {
      users: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    },
    update: (...args: unknown[]) => mockUpdate(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();
const mockBillingPortalSessionsCreate = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: {
      create: (args: unknown) => mockCustomersCreate(args),
    },
    checkout: {
      sessions: {
        create: (args: unknown) => mockCheckoutSessionsCreate(args),
      },
    },
    billingPortal: {
      sessions: {
        create: (args: unknown) => mockBillingPortalSessionsCreate(args),
      },
    },
  },
}));

vi.mock("@/lib/sentry", () => ({
  captureException: vi.fn(),
}));

import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Dynamic import after mocks
async function getCheckoutPost() {
  const mod = await import("@/app/api/checkout/create-session/route");
  return mod.POST;
}

async function getPortalPost() {
  const mod = await import("@/app/api/billing/portal/route");
  return mod.POST;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: "auth_123",
        email: "test@example.com",
        user_metadata: { full_name: "Test User" },
      },
    },
  });
  mockFindFirst.mockResolvedValue({
    id: "user_1",
    authId: "auth_123",
    email: "test@example.com",
    stripeCustomerId: "cus_existing",
  });
  mockCustomersCreate.mockResolvedValue({ id: "cus_new" });
  mockCheckoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session_123" });
  mockBillingPortalSessionsCreate.mockResolvedValue({ url: "https://billing.stripe.com/portal_123" });
});

describe("POST /api/checkout/create-session", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const POST = await getCheckoutPost();
    const req = new Request("http://localhost/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "essentials" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when planId is invalid", async () => {
    const POST = await getCheckoutPost();
    const req = new Request("http://localhost/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "invalid" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when user has not completed onboarding", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    const POST = await getCheckoutPost();
    const req = new Request("http://localhost/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "essentials" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates checkout session for subscription plan and returns url", async () => {
    const POST = await getCheckoutPost();
    const req = new Request("http://localhost/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "pro" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://checkout.stripe.com/session_123");
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_existing",
        client_reference_id: "auth_123",
        mode: "subscription",
        line_items: [{ price: "price_pro", quantity: 1 }],
      })
    );
  });

  it("creates checkout session for one-time diagnostic plan", async () => {
    const POST = await getCheckoutPost();
    const req = new Request("http://localhost/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "solo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        line_items: [{ price: "price_solo", quantity: 1 }],
      })
    );
  });

  it("creates Stripe customer when user has none", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "user_1",
      authId: "auth_123",
      email: "test@example.com",
      fullName: null,
      stripeCustomerId: null,
    });
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    mockUpdateSet.mockReturnValueOnce({ where: mockWhere });

    const POST = await getCheckoutPost();
    const req = new Request("http://localhost/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "essentials" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockCustomersCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        metadata: expect.objectContaining({ authId: "auth_123", userId: "user_1" }),
      })
    );
    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_new" })
    );
  });

  it("returns 503 when Stripe secret key is missing", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const POST = await getCheckoutPost();
    const req = new Request("http://localhost/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "essentials" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
  });

  it("returns 400 for invalid JSON body", async () => {
    const POST = await getCheckoutPost();
    const req = new Request("http://localhost/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 502 when Stripe API rejects checkout creation", async () => {
    const { default: Stripe } = await import("stripe");
    mockCheckoutSessionsCreate.mockRejectedValueOnce(
      new Stripe.errors.StripeInvalidRequestError({
        message: "No such price",
        type: "invalid_request_error",
      })
    );

    const POST = await getCheckoutPost();
    const req = new Request("http://localhost/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "essentials" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toMatch(/Unable to start checkout/i);
  });
});

describe("POST /api/billing/portal", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const POST = await getPortalPost();
    const req = new Request("http://localhost/api/billing/portal", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("redirects to pricing when user has no Stripe customer", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "user_1",
      stripeCustomerId: null,
    });
    const POST = await getPortalPost();
    const req = new Request("http://localhost/api/billing/portal", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost:3000/pricing");
  });

  it("redirects to Stripe portal url when user has customer", async () => {
    const POST = await getPortalPost();
    const req = new Request("http://localhost/api/billing/portal", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://billing.stripe.com/portal_123");
    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_existing",
        return_url: "http://localhost:3000/dashboard",
      })
    );
  });
});
