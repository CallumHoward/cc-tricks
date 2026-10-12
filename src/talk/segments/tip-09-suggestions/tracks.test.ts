import { describe, expect, it } from "vitest";

import { settleTime, SPRINGS } from "#/engine/motion/spring";
import { smear, whipOffset } from "#/talk/kit/tui/tui-math";

import {
  botX,
  breakWords,
  collapseScale,
  letterScale,
  riseStart,
  scrollY,
  sweepX,
  T9,
} from "./tracks";

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

  it("should settle the struck ghost by the readable deadline and keep it legible at the stop", () => {
    const settled = collapseScale(T9.at - 0.8);
    expect(collapseScale(T9.collapseAt)).toBe(1);
    expect(settled).toBeCloseTo(0.8, 5);
    expect(collapseScale(T9.at)).toBeGreaterThan(0.75);
    expect(0.2 + 0.8 * letterScale(collapseScale(T9.holdEnd), 0, 30)).toBeGreaterThan(0.7);
  });

  it("should suck the ghost into the caret during the fold", () => {
    expect(collapseScale(T9.exit.foldAt + 0.3)).toBe(0);
  });

  it("should collapse letters near the caret before the far end", () => {
    expect(letterScale(0.5, 0, 30)).toBeLessThan(letterScale(0.5, 29, 30));
  });

  it("should have the transcript scrolled and still by the time copy must settle", () => {
    expect(scrollY(T9.at - 0.8)).toBeCloseTo(-120, 0);
    expect(scrollY(T9.start)).toBeCloseTo(0, 5);
  });

  it("should launch a title's first word one stagger per later word before the last settles", () => {
    const last = 10 - settleTime(SPRINGS.LAND);
    expect(riseStart("a b\nc", 10)).toBeCloseTo(last - 2 * 0.07, 9);
  });

  it("should break copy into lines of the given word counts", () => {
    expect(breakWords("a b c d e", [2, 2])).toBe("a b\nc d\ne");
  });

  it("should come to rest on the home shot before the window ends", () => {
    const { whipAt, whipDur } = T9.exit;
    const offset = (tau: number) => whipOffset(tau, whipAt, whipDur, 1080);
    const edge = T9.end - 0.05;
    expect(offset(edge)).toBe(1080);
    expect(smear(offset, edge, 0)).toEqual({ blur: 0, stretch: 1 });
    expect(botX(edge)).toBeCloseTo(0, 10);
  });
});
