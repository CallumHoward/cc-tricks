import { describe, expect, it } from "vitest";

import {
  AT,
  botOffset,
  CRACK,
  dispatches,
  dockY,
  hammerGap,
  HOLD_END,
  walnutHalf,
  WIN,
} from "./tracks";

describe("tip 4 tracks", () => {
  it("should hang the hammer 4 px above the walnut at the stop", () => {
    expect(hammerGap(AT)).toBeCloseTo(4, 5);
  });

  it("should creep the hammer no faster than 0.5 px per story second and never touch the walnut in the hold", () => {
    expect(hammerGap(AT) - hammerGap(HOLD_END)).toBeCloseTo(1.5, 5);
    expect(hammerGap(HOLD_END)).toBeGreaterThan(0);
  });

  it("should crack the walnut only after the hold", () => {
    expect(walnutHalf(1, HOLD_END).rotate).toBe(0);
    expect(walnutHalf(1, CRACK + 0.4).rotate).toBeGreaterThan(30);
  });

  it("should count thirty dispatches for ten tasks", () => {
    expect(dispatches(AT)).toBe(30);
  });

  it("should rest on the home shot at both window edges", () => {
    for (const tau of [WIN.start, WIN.end - 0.01]) {
      expect(dockY(tau)).toBeCloseTo(0, 3);
      expect(botOffset(tau).x).toBeCloseTo(0, 3);
      expect(botOffset(tau).y).toBeCloseTo(0, 3);
    }
  });
});
