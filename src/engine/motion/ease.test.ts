import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  clamp,
  type Ease,
  inExpo,
  inOutCubic,
  inOutExpo,
  inOutQuad,
  inQuad,
  lerp,
  linear,
  outBack,
  outCubic,
  outExpo,
  outQuad,
  prog,
  remap,
  smootherstep,
  smoothstep,
} from "./ease";

describe("ease", () => {
  const EASES: [string, Ease][] = [
    ["linear", linear],
    ["inQuad", inQuad],
    ["outQuad", outQuad],
    ["inOutQuad", inOutQuad],
    ["outCubic", outCubic],
    ["inOutCubic", inOutCubic],
    ["inExpo", inExpo],
    ["outExpo", outExpo],
    ["inOutExpo", inOutExpo],
    ["outBack", outBack()],
    ["smoothstep", smoothstep],
    ["smootherstep", smootherstep],
  ];

  it("should pin every ease to 0 at u = 0 and 1 at u = 1", () => {
    for (const [name, ease] of EASES) {
      expect([name, ease(0)]).toEqual([name, expect.closeTo(0, 3)]);
      expect([name, ease(1)]).toEqual([name, expect.closeTo(1, 9)]);
    }
  });

  it("should keep monotonic eases monotonic", () => {
    for (const [, ease] of EASES.filter(([n]) => n !== "outBack")) {
      let prev = ease(0);
      for (let u = 0.01; u <= 1; u += 0.01) {
        expect(ease(u)).toBeGreaterThanOrEqual(prev - 1e-12);
        prev = ease(u);
      }
    }
  });

  it("should place symmetric in-out eases at one half in the middle", () => {
    for (const ease of [inOutQuad, inOutCubic, inOutExpo, smoothstep, smootherstep]) {
      expect(ease(0.5)).toBeCloseTo(0.5, 9);
    }
  });

  it("should overshoot with outBack", () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => outBack()(i / 100)));
    expect(peak).toBeGreaterThan(1);
    expect(outBack(0)(0.5)).toBeCloseTo(outCubic(0.5), 12);
  });

  it("should clamp, lerp and remap", () => {
    expect(clamp(2)).toBe(1);
    expect(clamp(-2)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(remap(5, 0, 10, 100, 200)).toBe(150);
    expect(remap(15, 0, 10, 100, 200)).toBe(250);
    expect(remap(3, 1, 1, 0, 9)).toBe(9);
  });

  it("should compute clamped eased progress through a window", () => {
    expect(prog(0, 1, 3)).toBe(0);
    expect(prog(2, 1, 3)).toBe(0.5);
    expect(prog(9, 1, 3)).toBe(1);
    expect(prog(2, 1, 3, inQuad)).toBe(0.25);
    expect(prog(1, 2, 2)).toBe(0);
    expect(prog(2, 2, 2)).toBe(1);
  });

  it("should keep progress within [0, 1] for any input", () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        (x, a) => {
          const p = prog(x, a, a + 1, smoothstep);
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(1);
        },
      ),
    );
  });
});
