import { describe, expect, it } from "vitest";

import { SHOTS } from "./shots";
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
  type Distort,
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

const GLIDE = SHOTS.glide;

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
    for (const rig of Object.values(SHOTS)) {
      expect(cameraAt(10.1, rig).z).toBeLessThan(cameraAt(10, rig).z);
      expect(cameraAt(9.9, rig).z).toBeGreaterThan(cameraAt(10, rig).z);
    }
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

  it("should seat floor lights on the surface even inside a gravity well", () => {
    const rho = 37.2;
    const mood = moodAt(30, SEGMENTS, STOPS);
    const distort: Distort = { warp: mood.warp, well: 1, ripple: 0.5, cx: 2, cz: -150 };
    const field = { anchorZ: -148, focusX: 0, distort, presence: 1 };
    const floor = lightsAt(rho, mood, field).filter((_, i) => i % 2 === 0);
    for (const l of floor) expect(l.y).toBeCloseTo(heightAt(l.x, l.z, rho, distort) + 0.06, 6);
  });

  it("should sink the floor into the well at its centre", () => {
    const distort: Distort = { warp: 0, well: 1, ripple: 0, cx: 3, cz: -40 };
    expect(heightAt(3, -40, 0, distort)).toBeLessThan(heightAt(13, -40, 0, distort) - 3);
  });

  it("should keep the light field ahead of its anchor as it travels", () => {
    for (const rho of [0, 50, 312.5]) {
      const anchorZ = cameraAt(rho, GLIDE).z;
      const distort: Distort = { warp: 1, well: 0, ripple: 0, cx: 0, cz: 0 };
      const field = { anchorZ, focusX: 0, distort, presence: 1 };
      for (const l of lightsAt(rho, MOODS["outro"]!, field))
        expect(l.z).toBeLessThan(anchorZ + 2.01);
    }
  });

  it("should put out every light while the backdrop is absent", () => {
    const distort: Distort = { warp: 1, well: 0, ripple: 0, cx: 0, cz: 0 };
    const field = { anchorZ: 0, focusX: 0, distort, presence: 0 };
    for (const l of lightsAt(3, MOODS["outro"]!, field)) expect(l.intensity).toBe(0);
  });
});
