import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

// ── Mocks ──────────────────────────────────────────────────────────────────────

// Mock env vars before any imports that use them
vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
vi.stubEnv("STRIPE_PRICE_ESSENTIALS", "price_essentials");
vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
vi.stubEnv("STRIPE_PRICE_GROUP", "price_group");
vi.stubEnv("STRIPE_PRICE_DIAGNOSTIC_SOLO", "price_solo");
vi.stubEnv("STRIPE_PRICE_DIAGNOSTIC_STAFF", "price_staff");
vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@localhost:5432/fake");

const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
const mockUpdateSet = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
const mockFindFirst = vi.fn();

vi.mock("@/db", () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    query: {
      users: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
      subscriptions: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
  priceToPlan: (priceId: string) => {
    const map: Record<string, string> = {
      price_essentials: "essentials",
      price_pro: "pro",
      price_group: "group",
    };
    return map[priceId] ?? "free";
  },
  priceToDiagnosticPlan: (priceId: string) => {
    const map: Record<string, string> = {
      price_solo: "solo",
      price_staff: "staff_pulse",
    };
    return map[priceId] ?? null;
  },
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────────

import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleCheckoutSessionCompleted,
} from "@/app/api/webhooks/stripe/route";
import { stripe } from "@/lib/stripe";
import { subscriptions, users, diagnosticPurchases } from "@/db/schema";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeSubscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: "sub_123",
    object: "subscription",
    customer: "cus_123",
    status: "active",
    cancel_at_period_end: false,
    items: {
      object: "list",
      data: [
        {
          id: "si_123",
          object: "subscription_item",
          price: { id: "price_pro" } as Stripe.Price,
          current_period_start: 1700000000,
          current_period_end: 1702592000,
        } as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: "",
    },
    ...overrides,
  } as Stripe.Subscription;
}

function makeCheckoutSession(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: "cs_123",
    object: "checkout.session",
    mode: "subscription",
    customer: "cus_123",
    subscription: "sub_123",
    client_reference_id: "auth_user_123",
    ...overrides,
  } as Stripe.Checkout.Session;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleSubscriptionCreated", () => {
  it("inserts a new subscription for an existing user", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: "user_uuid_1", stripeCustomerId: "cus_123" });

    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    await handleSubscriptionCreated(makeSubscription());

    expect(mockInsert).toHaveBeenCalledWith(subscriptions);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_uuid_1",
        stripeSubscriptionId: "sub_123",
        stripeCustomerId: "cus_123",
        stripePriceId: "price_pro",
        plan: "pro",
        status: "active",
        cancelAtPeriodEnd: false,
      })
    );
  });

  it("throws if no user found for the Stripe customer", async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    await expect(handleSubscriptionCreated(makeSubscription())).rejects.toThrow(
      "No user found for Stripe customer cus_123"
    );
  });

  it("maps price IDs to correct plans", async () => {
    mockFindFirst.mockResolvedValueOnce({ id: "user_uuid_1", stripeCustomerId: "cus_123" });
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    const sub = makeSubscription();
    (sub.items.data[0].price as Stripe.Price).id = "price_essentials";

    await handleSubscriptionCreated(sub);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "essentials" })
    );
  });
});

describe("handleSubscriptionUpdated", () => {
  it("updates the subscription record with new data", async () => {
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    mockUpdateSet.mockReturnValue({ where: mockWhere });

    await handleSubscriptionUpdated(makeSubscription({ status: "past_due" }));

    expect(mockUpdate).toHaveBeenCalledWith(subscriptions);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        stripePriceId: "price_pro",
        plan: "pro",
        status: "past_due",
        cancelAtPeriodEnd: false,
      })
    );
    expect(mockWhere).toHaveBeenCalled();
  });

  it("handles plan changes via price ID update", async () => {
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    mockUpdateSet.mockReturnValue({ where: mockWhere });

    const sub = makeSubscription();
    (sub.items.data[0].price as Stripe.Price).id = "price_group";

    await handleSubscriptionUpdated(sub);

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "group", stripePriceId: "price_group" })
    );
  });
});

describe("handleSubscriptionDeleted", () => {
  it("sets subscription status to canceled", async () => {
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    mockUpdateSet.mockReturnValue({ where: mockWhere });

    await handleSubscriptionDeleted(makeSubscription());

    expect(mockUpdate).toHaveBeenCalledWith(subscriptions);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "canceled",
        cancelAtPeriodEnd: false,
      })
    );
    expect(mockWhere).toHaveBeenCalled();
  });

  it("updates the updatedAt timestamp", async () => {
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    mockUpdateSet.mockReturnValue({ where: mockWhere });

    await handleSubscriptionDeleted(makeSubscription());

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        updatedAt: expect.any(Date),
      })
    );
  });
});

describe("handleCheckoutSessionCompleted", () => {
  it("links Stripe customer to user and creates subscription if not exists", async () => {
    // First call: update user's stripeCustomerId
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    mockUpdateSet.mockReturnValue({ where: mockWhere });

    // Second call: findFirst for existing subscription returns null
    mockFindFirst.mockResolvedValueOnce(null);

    // Third call: stripe.subscriptions.retrieve
    const mockRetrieve = vi.mocked(stripe.subscriptions.retrieve);
    const fullSub = makeSubscription();
    mockRetrieve.mockResolvedValueOnce(fullSub as Stripe.Response<Stripe.Subscription>);

    // Fourth call: findFirst for user in handleSubscriptionCreated
    mockFindFirst.mockResolvedValueOnce({ id: "user_uuid_1", stripeCustomerId: "cus_123" });
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    await handleCheckoutSessionCompleted(makeCheckoutSession());

    // Should have updated the user
    expect(mockUpdate).toHaveBeenCalledWith(users);
    // Should have retrieved from Stripe
    expect(mockRetrieve).toHaveBeenCalledWith("sub_123");
    // Should have inserted the subscription
    expect(mockInsert).toHaveBeenCalledWith(subscriptions);
  });

  it("inserts diagnostic purchase for payment mode with solo plan", async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    await handleCheckoutSessionCompleted(
      makeCheckoutSession({
        mode: "payment",
        subscription: null,
        metadata: { planId: "solo", userId: "user_uuid_1" },
      } as unknown as Partial<Stripe.Checkout.Session>)
    );

    expect(mockInsert).toHaveBeenCalledWith(diagnosticPurchases);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_uuid_1",
        plan: "solo",
      })
    );
  });

  it("skips payment mode if metadata is missing", async () => {
    await handleCheckoutSessionCompleted(
      makeCheckoutSession({
        mode: "payment",
        subscription: null,
        metadata: {},
      } as unknown as Partial<Stripe.Checkout.Session>)
    );

    expect(mockInsert).not.toHaveBeenCalledWith(diagnosticPurchases);
  });

  it("does not create subscription if it already exists", async () => {
    const mockWhere = vi.fn().mockResolvedValue(undefined);
    mockUpdateSet.mockReturnValue({ where: mockWhere });

    // Subscription already exists
    mockFindFirst.mockResolvedValueOnce({ id: "existing_sub" });

    await handleCheckoutSessionCompleted(makeCheckoutSession());

    // Should have updated user, but NOT inserted a subscription
    expect(mockUpdate).toHaveBeenCalledWith(users);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("skips if customer or subscription is missing", async () => {
    await handleCheckoutSessionCompleted(
      makeCheckoutSession({ customer: null, subscription: null } as unknown as Partial<Stripe.Checkout.Session>)
    );

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
