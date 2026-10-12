import { describe, expect, it } from "vitest";

import type { Frame } from "#/engine/types";

import { DEFAULT_OVERLAY, grainPixels, overlayState } from "./overlay-state";

const at = (w: number, v = 1, tau = 0): Frame => ({ tau, v, w, dt: 1 / 60 });

describe("overlay state", () => {
  it("should be a pure function of wall time and velocity", () => {
    expect(overlayState(at(3.2, 1, 10))).toEqual(overlayState(at(3.2, 1, 99)));
  });

  it("should keep the grain offset within one wall frame and move it on the next", () => {
    const a = overlayState(at(1));
    const same = overlayState(at(1 + 0.5 / DEFAULT_OVERLAY.fps));
    expect([same.x, same.y]).toEqual([a.x, a.y]);
    const b = overlayState(at(1 + 1 / DEFAULT_OVERLAY.fps));
    expect([b.x, b.y]).not.toEqual([a.x, a.y]);
  });

  it("should keep offsets inside the tile", () => {
    for (let w = 0; w < 5; w += 0.37) {
      const s = overlayState(at(w));
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThan(DEFAULT_OVERLAY.tile);
      expect(s.y).toBeLessThan(DEFAULT_OVERLAY.tile);
    }
  });

  it("should add grain and the rewind look only while rewinding", () => {
    expect(overlayState(at(1, 0.035)).rewind).toBe(0);
    expect(overlayState(at(1, 0.035)).grain).toBe(DEFAULT_OVERLAY.grain);
    const back = overlayState(at(1, -8));
    expect(back.rewind).toBeGreaterThan(0.8);
    expect(back.grain).toBeGreaterThan(DEFAULT_OVERLAY.grain);
  });

  it("should generate a deterministic opaque grey tile centered on mid grey", () => {
    const a = grainPixels(16, 7);
    expect(a).toEqual(grainPixels(16, 7));
    expect(a).not.toEqual(grainPixels(16, 8));
    let sum = 0;
    for (let i = 0; i < a.length; i += 4) {
      expect(a[i]).toBe(a[i + 1]);
      expect(a[i + 3]).toBe(255);
      sum += a[i] ?? 0;
    }
    expect(Math.abs(sum / (a.length / 4) - 128)).toBeLessThan(16);
  });
});
