import { describe, it, expect } from "vitest";
import {
  advanceChangeIndex,
  getActiveChangeIndex,
} from "@/lib/venue-progress";

describe("venue-progress", () => {
  it("returns 0 when prescription key does not match stored progress", () => {
    expect(
      getActiveChangeIndex(
        { changeProgress: { prescriptionKey: "old", activeIndex: 2 } },
        "new"
      )
    ).toBe(0);
  });

  it("returns stored index when prescription key matches", () => {
    expect(
      getActiveChangeIndex(
        { changeProgress: { prescriptionKey: "rx-1", activeIndex: 1 } },
        "rx-1"
      )
    ).toBe(1);
  });

  it("advances index but does not exceed max", () => {
    const updated = advanceChangeIndex(
      { other: true },
      "rx-1",
      1,
      2
    );
    expect(updated.changeProgress).toEqual({
      prescriptionKey: "rx-1",
      activeIndex: 2,
    });

    const capped = advanceChangeIndex({}, "rx-1", 2, 2);
    expect(capped.changeProgress?.activeIndex).toBe(2);
  });
});
