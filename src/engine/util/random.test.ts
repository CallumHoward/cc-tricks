import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { fbm1, hash1, hash2, mulberry32, noise1, noise2 } from "./random";

describe("random", () => {
  it("should produce the same sequence for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const xs = Array.from({ length: 50 }, () => a());
    expect(Array.from({ length: 50 }, () => b())).toEqual(xs);
    const c = mulberry32(43);
    expect(Array.from({ length: 50 }, () => c())).not.toEqual(xs);
  });

  it("should match the reference mulberry32 output", () => {
    // First outputs of the canonical implementation for seed 1.
    const r = mulberry32(1);
    expect(r()).toBeCloseTo(0.6270739405881613, 15);
    expect(r()).toBeCloseTo(0.002735721180215478, 15);
  });

  it("should keep generator output in [0, 1) with a roughly uniform mean", () => {
    const r = mulberry32(9);
    let sum = 0;
    for (let i = 0; i < 10_000; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      sum += x;
    }
    expect(sum / 10_000).toBeCloseTo(0.5, 1);
  });

  it("should hash deterministically into [0, 1)", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (x, y) => {
        expect(hash1(x)).toBe(hash1(x));
        expect(hash2(x, y)).toBe(hash2(x, y));
        for (const h of [hash1(x), hash2(x, y)]) {
          expect(h).toBeGreaterThanOrEqual(0);
          expect(h).toBeLessThan(1);
        }
      }),
    );
  });

  it("should hash neighbouring lattice points to different values", () => {
    expect(hash1(0)).not.toBe(hash1(1));
    expect(hash2(0, 1)).not.toBe(hash2(1, 0));
  });

  it("should equal the lattice hash on integer inputs", () => {
    for (let i = -5; i < 5; i++) {
      expect(noise1(i)).toBeCloseTo(hash1(i) * 2 - 1, 12);
      expect(noise2(i, 3)).toBeCloseTo(hash2(i, 3) * 2 - 1, 12);
    }
  });

  it("should keep noise within [-1, 1] and continuous", () => {
    fc.assert(
      fc.property(fc.double({ min: -1e4, max: 1e4, noNaN: true }), (x) => {
        for (const n of [noise1(x), noise2(x, x * 0.7), fbm1(x)]) {
          expect(n).toBeGreaterThanOrEqual(-1);
          expect(n).toBeLessThanOrEqual(1);
        }
        expect(Math.abs(noise1(x + 1e-4) - noise1(x))).toBeLessThan(1e-3);
        expect(Math.abs(noise2(x + 1e-4, 2) - noise2(x, 2))).toBeLessThan(1e-3);
      }),
    );
  });

  it("should return zero fbm when no octaves are requested", () => {
    expect(fbm1(1.3, 0)).toBe(0);
    expect(fbm1(1.3, 1)).toBeCloseTo(noise1(1.3), 12);
  });
});
