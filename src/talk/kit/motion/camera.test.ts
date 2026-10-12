import { describe, expect, it } from "vitest";

import { inOutCubic } from "#/engine/motion/ease";

import { HOME, mixCam, shotTrack, smearFor, toScreen, zoomAbout } from "./camera";

describe("camera", () => {
  it("should keep the zoom focus fixed on screen through a zoomAbout move", () => {
    const focus = { x: 230, y: 500 };
    const end = zoomAbout(HOME, focus, 30);
    const before = toScreen(HOME, focus);
    for (const u of [0, 0.25, 0.5, 0.9, 1]) {
      const p = toScreen(mixCam(HOME, end, u), focus);
      expect(p.x).toBeCloseTo(before.x, 6);
      expect(p.y).toBeCloseTo(before.y, 6);
    }
  });

  it("should land exactly on both shots and interpolate zoom in log space", () => {
    const b = { x: 300, y: 200, zoom: 4, roll: 10, tilt: 30 };
    const start = mixCam(HOME, b, 0);
    const end = mixCam(HOME, b, 1);
    expect(start.x).toBeCloseTo(HOME.x, 6);
    expect(end.x).toBeCloseTo(300, 6);
    expect(end.y).toBeCloseTo(200, 6);
    expect(mixCam(HOME, b, 0.5).zoom).toBeCloseTo(2, 6);
  });

  it("should hold the first shot before it and the last shot after it", () => {
    const camAt = shotTrack([
      { at: 1, x: 100 },
      { at: 2, x: 500, zoom: 2, ease: inOutCubic },
    ]);
    expect(camAt(0).x).toBe(100);
    expect(camAt(5).x).toBe(500);
    expect(camAt(5).zoom).toBe(2);
  });

  it("should not smear when the playhead is stopped", () => {
    expect(smearFor({ vx: 4000, vy: 0, vz: 0 }, 0)).toEqual({ sx: 0, sy: 0 });
    expect(smearFor({ vx: 4000, vy: 0, vz: 0 }, 2).sx).toBeGreaterThan(0);
  });
});
