import { describe, expect, it } from "vitest";

import { settleTime, SPRINGS } from "#/engine/motion/spring";

import {
  botX,
  collapseScale,
  foldAt,
  glintX,
  letterScale,
  lineRise,
  plateOut,
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

  it("should take at least 0.35 τ-seconds to dolly the plate away", () => {
    expect(T9.exit.foldDur).toBeGreaterThanOrEqual(0.35);
    expect(foldAt(T9.exit.foldAt + 0.1)).toBeLessThan(0.25);
  });

  it("should leave the plate lifted, shrunk and gone once the exit dolly ends", () => {
    expect(plateOut(0)).toMatchObject({ scale: 1, opacity: 1 });
    expect(plateOut(1)).toEqual({ y: -48, scale: 0.94, opacity: 0 });
  });

  it("should loop the read glint along the swept span and wrap on rewind", () => {
    expect(glintX(0, 600)).toBe(0);
    expect(glintX(1.2, 600)).toBeCloseTo(300, 6);
    expect(glintX(-1.2, 600)).toBeCloseTo(300, 6);
  });

  it("should come to rest on the home shot before the window ends", () => {
    const edge = T9.end - 0.05;
    expect(T9.exit.riseAt + T9.exit.riseDur).toBeLessThan(T9.end);
    expect(lineRise(edge)).toBe(1);
    expect(botX(edge)).toBeCloseTo(0, 10);
  });
});
