import { describe, expect, it } from "vitest";

import {
  cameraAt,
  heightAt,
  lightsAt,
  moodAt,
  MOODS,
  PARALLAX_PX,
  PARALLAX_SCALE,
  parallaxAt,
  transitAt,
  type MoodSegment,
  type MoodStop,
} from "./world";

const SEGMENTS: MoodSegment[] = [
  { id: "title", window: { start: -1, end: 23.4 } },
  { id: "tip-02-cache", window: { start: 23.4, end: 60 } },
  { id: "outro", window: { start: 60, end: 90 } },
];
const STOPS: MoodStop[] = [
  { at: 12, holdSpan: 2 },
  { at: 40, holdSpan: 3 },
  { at: 80, holdSpan: 4 },
];

const sweep = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

describe("backdrop world", () => {
  it("should keep the slide plane drift within the parallax bounds", () => {
    for (const rho of sweep(-5, 600, 0.37)) {
      const p = parallaxAt(rho);
      expect(Math.abs(p.x)).toBeLessThanOrEqual(PARALLAX_PX);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(PARALLAX_PX);
      expect(p.scale).toBeGreaterThanOrEqual(1);
      expect(p.scale).toBeLessThanOrEqual(1 + PARALLAX_SCALE);
    }
  });

  it("should dolly forward as ambient time advances and back when it rewinds", () => {
    expect(cameraAt(10.1).z).toBeLessThan(cameraAt(10).z);
    expect(cameraAt(9.9).z).toBeGreaterThan(cameraAt(10).z);
  });

  it("should crossfade moods continuously across segment boundaries", () => {
    for (const { window } of SEGMENTS.slice(1)) {
      const before = moodAt(window.start - 1e-3, SEGMENTS, STOPS);
      const after = moodAt(window.start + 1e-3, SEGMENTS, STOPS);
      for (const key of Object.keys(before) as (keyof typeof before)[])
        expect(after[key]).toBeCloseTo(before[key], 2);
    }
  });

  it("should settle on the segment's own mood away from boundaries", () => {
    const mood = moodAt(40.5, SEGMENTS, STOPS);
    expect(mood.warp).toBeCloseTo(MOODS["tip-02-cache"]!.warp);
  });

  it("should quiet the grid at a stop and open it up in transit", () => {
    expect(transitAt(41, STOPS)).toBe(0);
    expect(transitAt(28, STOPS)).toBe(1);
    const held = moodAt(41, SEGMENTS, STOPS);
    const moving = moodAt(30, SEGMENTS, STOPS);
    expect(held.grid).toBeLessThan(moving.grid);
    expect(held.calm).toBeGreaterThan(moving.calm);
  });

  it("should seat floor lights on the warped surface", () => {
    const rho = 37.2;
    const mood = moodAt(30, SEGMENTS, STOPS);
    const floor = lightsAt(rho, mood).filter((_, i) => i % 2 === 0);
    for (const l of floor) expect(l.y).toBeCloseTo(heightAt(l.x, l.z, rho, mood.warp) + 0.06, 6);
  });

  it("should keep the light field ahead of the camera as it travels", () => {
    for (const rho of [0, 50, 312.5]) {
      const camZ = cameraAt(rho).z;
      for (const l of lightsAt(rho, MOODS["outro"]!)) expect(l.z).toBeLessThan(camZ + 2.01);
    }
  });
});
