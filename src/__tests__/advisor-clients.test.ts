import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@localhost:5432/fake");

const mockVenuesFindFirst = vi.fn();
const mockCheckinsFindFirst = vi.fn();
const mockDomainScoresFindMany = vi.fn();
const mockPrescriptionsFindFirst = vi.fn();
const mockAdvisorClientsFindMany = vi.fn();
const mockAdvisorClientsFindFirst = vi.fn();

vi.mock("@/db", () => ({
  db: {
    query: {
      venues: { findFirst: (...args: unknown[]) => mockVenuesFindFirst(...args) },
      checkins: { findFirst: (...args: unknown[]) => mockCheckinsFindFirst(...args) },
      domainScores: { findMany: (...args: unknown[]) => mockDomainScoresFindMany(...args) },
      prescriptions: { findFirst: (...args: unknown[]) => mockPrescriptionsFindFirst(...args) },
      advisorClients: {
        findMany: (...args: unknown[]) => mockAdvisorClientsFindMany(...args),
        findFirst: (...args: unknown[]) => mockAdvisorClientsFindFirst(...args),
      },
    },
  },
}));

import { getClientSummary, getAdvisorClients, advisorOwnsClient } from "@/lib/advisor";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getClientSummary", () => {
  it("returns calm index, domain scores, and latest prescription", async () => {
    mockVenuesFindFirst.mockResolvedValueOnce({
      id: "venue_1",
      name: "The Local Kitchen",
      venueType: "restaurant",
    });
    mockCheckinsFindFirst.mockResolvedValueOnce({ calmIndex: 7.5 });
    mockDomainScoresFindMany.mockResolvedValueOnce([
      { domain: "throughput", score: 2.5 },
      { domain: "defaults", score: 1.8 },
    ]);
    mockPrescriptionsFindFirst.mockResolvedValueOnce({
      primaryDomain: "defaults",
      primaryProblem: "Protocols break down under pressure.",
      weekFocus: "Document exception handling.",
      watchSignal: "Fewer escalations to managers.",
      createdAt: new Date("2026-01-01"),
    });

    const summary = await getClientSummary("venue_1");

    expect(summary).not.toBeNull();
    expect(summary?.venueName).toBe("The Local Kitchen");
    expect(summary?.calmIndex).toBe(7.5);
    expect(summary?.domainScores).toHaveLength(2);
    expect(summary?.latestPrescription?.primaryDomain).toBe("defaults");
  });

  it("returns null when the venue does not exist", async () => {
    mockVenuesFindFirst.mockResolvedValueOnce(undefined);
    const summary = await getClientSummary("missing");
    expect(summary).toBeNull();
  });

  it("handles venues with no check-ins or prescriptions", async () => {
    mockVenuesFindFirst.mockResolvedValueOnce({
      id: "venue_2",
      name: "New Venue",
      venueType: null,
    });
    mockCheckinsFindFirst.mockResolvedValueOnce(undefined);
    mockDomainScoresFindMany.mockResolvedValueOnce([]);
    mockPrescriptionsFindFirst.mockResolvedValueOnce(undefined);

    const summary = await getClientSummary("venue_2");

    expect(summary?.calmIndex).toBeNull();
    expect(summary?.domainScores).toEqual([]);
    expect(summary?.latestPrescription).toBeNull();
  });
});

describe("getAdvisorClients", () => {
  it("returns a summary for each linked client venue", async () => {
    mockAdvisorClientsFindMany.mockResolvedValueOnce([
      { venueId: "venue_1" },
      { venueId: "venue_2" },
    ]);

    // venue_1
    mockVenuesFindFirst.mockResolvedValueOnce({ id: "venue_1", name: "Venue One", venueType: "cafe" });
    mockCheckinsFindFirst.mockResolvedValueOnce({ calmIndex: 6 });
    mockDomainScoresFindMany.mockResolvedValueOnce([{ domain: "pacing", score: 2 }]);
    mockPrescriptionsFindFirst.mockResolvedValueOnce(undefined);

    // venue_2
    mockVenuesFindFirst.mockResolvedValueOnce({ id: "venue_2", name: "Venue Two", venueType: "bar" });
    mockCheckinsFindFirst.mockResolvedValueOnce({ calmIndex: 8 });
    mockDomainScoresFindMany.mockResolvedValueOnce([{ domain: "endings", score: 3 }]);
    mockPrescriptionsFindFirst.mockResolvedValueOnce(undefined);

    const clients = await getAdvisorClients("adv_1");

    expect(clients).toHaveLength(2);
    expect(clients[0].venueName).toBe("Venue One");
    expect(clients[1].venueName).toBe("Venue Two");
    expect(clients[1].calmIndex).toBe(8);
  });

  it("returns an empty array when an advisor has no linked clients", async () => {
    mockAdvisorClientsFindMany.mockResolvedValueOnce([]);
    const clients = await getAdvisorClients("adv_empty");
    expect(clients).toEqual([]);
  });

  it("skips links whose venue no longer exists", async () => {
    mockAdvisorClientsFindMany.mockResolvedValueOnce([{ venueId: "gone" }]);
    mockVenuesFindFirst.mockResolvedValueOnce(undefined);

    const clients = await getAdvisorClients("adv_1");
    expect(clients).toEqual([]);
  });
});

describe("advisorOwnsClient", () => {
  it("returns true when a link exists", async () => {
    mockAdvisorClientsFindFirst.mockResolvedValueOnce({ id: "link_1" });
    await expect(advisorOwnsClient("adv_1", "venue_1")).resolves.toBe(true);
  });

  it("returns false when no link exists", async () => {
    mockAdvisorClientsFindFirst.mockResolvedValueOnce(undefined);
    await expect(advisorOwnsClient("adv_1", "venue_x")).resolves.toBe(false);
  });
});
