import { describe, expect, it } from "vitest";

import { HOP } from "#/talk/mascot/actions";
import { homeDrift } from "#/talk/segments/shared/test-utils";

import {
  AT,
  BOT_HOPS,
  botOffset,
  CRACK,
  dispatches,
  dockY,
  EXIT,
  FALL,
  hammerGap,
  hammerTilt,
  HOLD_END,
  odometerScale,
  PROP_OUT,
  propFold,
  RELEASE,
  SETTLE,
  walnutHalf,
  WIN,
} from "./tracks";

describe("tip 4 tracks", () => {
  it("should finish the press swing 6 px above the walnut by the stop's settle time", () => {
    expect(SETTLE).toBeLessThanOrEqual(AT - 0.8);
    expect(hammerGap(SETTLE)).toBeCloseTo(6, 5);
  });

  it("should creep the hammer no faster than 0.5 px per story second and never touch the walnut in the hold", () => {
    expect((hammerGap(SETTLE) - hammerGap(HOLD_END)) / (HOLD_END - SETTLE)).toBeCloseTo(0.5, 5);
    expect(hammerGap(HOLD_END)).toBeGreaterThan(0);
  });

  it("should accelerate the fall until it brakes into bullet time", () => {
    const speed = (tau: number) => (hammerGap(tau) - hammerGap(tau + 0.01)) / 0.01;
    expect(speed(FALL.join - 0.02)).toBeGreaterThan(speed(RELEASE + 0.1));
    expect(speed(FALL.join - 0.02)).toBeGreaterThan(speed(SETTLE - 0.02) * 10);
  });

  it("should turn the hammer no faster than 2 degrees per story second in the hold and land it flat", () => {
    const turn = Math.abs(hammerTilt(SETTLE) - hammerTilt(HOLD_END)) / (HOLD_END - SETTLE);
    expect(turn).toBeLessThanOrEqual(2);
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

  it("should finish the bot's hop home before the window ends", () => {
    const { at, air } = BOT_HOPS.home;
    expect(at + HOP.anticipation + air + HOP.recover).toBeLessThanOrEqual(WIN.end - 0.02);
  });

  it("should ease the hammer and walnut away over at least 0.35 story seconds after the crack", () => {
    expect(propFold(CRACK + 0.2).opacity).toBe(1);
    expect(PROP_OUT.end - PROP_OUT.start).toBeGreaterThanOrEqual(0.35);
    expect(propFold(PROP_OUT.end).opacity).toBe(0);
    expect(PROP_OUT.end).toBeLessThan(EXIT.whipAt);
  });

  it("should show the dispatch odometer only once the dock has dropped", () => {
    expect(odometerScale(153.3)).toBe(0);
    expect(odometerScale(154.3)).toBeCloseTo(1, 3);
  });

  it("should rest on the home shot at both window edges", () => {
    expect(homeDrift(WIN, dockY, botOffset)).toBeCloseTo(0, 3);
  });
});
