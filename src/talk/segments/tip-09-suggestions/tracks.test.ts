import { describe, expect, it } from "vitest";

import { breakWords, collapseScale, letterScale, scrollY, sweepX, T9 } from "./tracks";

describe("tip 9 tracks", () => {
  it("should hold the sweep's creep within 40 px per τ-second through the hold", () => {
    const step = 0.05;
    for (let tau: number = T9.at; tau < T9.holdEnd; tau += step) {
      expect(Math.abs(sweepX(tau + step) - sweepX(tau)) / step).toBeLessThanOrEqual(40);
    }
  });

  it("should keep the ghost's farthest letter under 40 px per τ-second in the hold", () => {
    const width = 30 * 20.4;
    const step = 0.05;
    for (let tau: number = T9.at; tau < T9.holdEnd; tau += step) {
      const v = (Math.abs(collapseScale(tau + step) - collapseScale(tau)) * width) / step;
      expect(v).toBeLessThanOrEqual(40);
    }
  });

  it("should leave the ghost mid-collapse at the stop", () => {
    expect(collapseScale(T9.at)).toBeCloseTo(0.3, 5);
    expect(collapseScale(T9.collapseAt)).toBe(1);
  });

  it("should collapse letters near the caret before the far end", () => {
    expect(letterScale(0.5, 0, 30)).toBeLessThan(letterScale(0.5, 29, 30));
  });

  it("should have the transcript scrolled and still by the time copy must settle", () => {
    expect(scrollY(T9.at - 0.8)).toBeCloseTo(-120, 0);
    expect(scrollY(T9.start)).toBeCloseTo(0, 5);
  });

  it("should break copy into lines of the given word counts", () => {
    expect(breakWords("a b c d e", [2, 2])).toBe("a b\nc d\ne");
  });
});
