import { describe, expect, it } from "vitest";

import { formatClock, pace } from "./console-model";

describe("console model", () => {
  it("should format durations as minutes and padded seconds", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(65_900)).toBe("1:05");
    expect(formatClock(-61_000)).toBe("-1:01");
  });

  it("should report pace against the budget share for the stop", () => {
    const budget = 1200;

    expect(pace(600_000, 5, 11, budget)).toBe("on");
    expect(pace(800_000, 5, 11, budget)).toBe("behind");
    expect(pace(100_000, 5, 11, budget)).toBe("ahead");
    expect(pace(999_000, 0, 1, budget)).toBe("on");
  });
});
