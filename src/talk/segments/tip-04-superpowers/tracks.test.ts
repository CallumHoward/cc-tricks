import { describe, expect, it } from "vitest";

import {
  AT,
  botOffset,
  CRACK,
  dispatches,
  dockY,
  EXIT,
  FALL,
  hammerGap,
  hammerTilt,
  HOLD_END,
  RELEASE,
  walnutHalf,
  WIN,
} from "./tracks";

describe("tip 4 tracks", () => {
  it("should hang the hammer 22 px above the walnut at the stop", () => {
    expect(hammerGap(AT)).toBeCloseTo(22, 5);
  });

  it("should creep the hammer no faster than 0.5 px per story second and never touch the walnut in the hold", () => {
    expect(hammerGap(AT) - hammerGap(HOLD_END)).toBeCloseTo(1.5, 5);
    expect(hammerGap(HOLD_END)).toBeGreaterThan(0);
  });

  it("should accelerate the fall until it brakes into bullet time", () => {
    const speed = (tau: number) => (hammerGap(tau) - hammerGap(tau + 0.01)) / 0.01;
    expect(speed(RELEASE + 0.5)).toBeGreaterThan(speed(RELEASE + 0.2));
    expect(speed(FALL.join - 0.02)).toBeGreaterThan(speed(AT - 0.02) * 10);
  });

  it("should turn the hammer no faster than 2 degrees per story second in the hold and land it flat", () => {
    expect(Math.abs(hammerTilt(AT) - hammerTilt(HOLD_END)) / (HOLD_END - AT)).toBeLessThanOrEqual(
      2,
    );
    expect(hammerTilt(CRACK)).toBeCloseTo(0, 5);
  });

  it("should show the split walnut for at least 0.45 story seconds before the plate folds", () => {
    expect(EXIT.fold - CRACK).toBeGreaterThanOrEqual(0.45 - 1e-9);
    expect(EXIT.whipEnd).toBeLessThan(WIN.end);
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
