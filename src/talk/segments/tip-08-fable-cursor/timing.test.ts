import { describe, expect, it } from "vitest";

import { ccTower, cursorTower, flapRows, quotaLeft, TIP8 } from "./timing";

describe("tip 8 timing", () => {
  it("should pad both board columns to the same number of lines", () => {
    const [a, b] = flapRows("Cursor pays API token pricing", "flat-rate plan", 24);
    expect(a).toEqual(["Cursor pays API token", "pricing"]);
    expect(b).toEqual(["flat-rate plan", ""]);
  });

  it("should finish the Cursor tower before the stop settles", () => {
    const { at } = TIP8.x18;
    expect(cursorTower(at - 0.8)).toBe(cursorTower(at + 2));
  });

  it("should grow the CC tower no faster than 40 px per second in the hold", () => {
    const { at, hold } = TIP8.x18;
    const speed = (ccTower(at + hold) - ccTower(at)) / hold;
    expect(speed).toBeGreaterThan(0);
    expect(speed).toBeLessThanOrEqual(40);
    expect(ccTower(at - 0.8) / cursorTower(at - 0.8)).toBeCloseTo(18, 0);
  });

  it("should drain Cursor's quota about 18 times faster than CC's for the same work", () => {
    const { rows, cache } = TIP8;
    const used = (speed: number) => 1 - quotaLeft(cache.at, speed);
    expect(quotaLeft(rows[0], 1)).toBe(1);
    expect(used(1) / used(1 / 18)).toBeCloseTo(18, 5);
    expect(quotaLeft(cache.at, 1)).toBeLessThan(0.2);
  });

  it("should keep the Cursor quota draining slowly through the hold without going below empty", () => {
    const { at, hold } = TIP8.cache;
    const drop = quotaLeft(at, 1) - quotaLeft(at + hold, 1);
    expect(drop).toBeGreaterThan(0);
    expect(drop).toBeLessThanOrEqual(0.03 * hold + 1e-9);
    expect(quotaLeft(at + 1000, 1)).toBe(0);
  });
});
