import { describe, expect, it } from "vitest";

import { ccTower, cursorTower, flapCounter, flapRows, TIP8 } from "./timing";

describe("tip 8 timing", () => {
  it("should pad both board columns to the same number of lines", () => {
    const [a, b] = flapRows("billed at API list price", "flat-rate plan", 13);
    expect(a).toEqual(["billed at API", "list price"]);
    expect(b).toEqual(["flat-rate", "plan"]);
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

  it("should turn the decorative counter at most one flap per second in the hold", () => {
    const { at, hold } = TIP8.cache;
    expect(flapCounter(at + hold) - flapCounter(at)).toBeLessThanOrEqual(hold);
  });
});
