import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  isSpring,
  settleTime,
  snapTime,
  SPRINGS,
  springAt,
  springEase,
  springProgress,
  springVelocityAt,
  type SpringCfg,
} from "./spring";

describe("spring", () => {
  // Reference numbers from research/motion-bible/springs.json (scanned at 1 ms).
  const REFERENCE: [
    name: keyof typeof SPRINGS,
    overshootPct: number,
    lands: number,
    rest2pct: number,
  ][] = [
    ["SLAM", 9.5, 0.092, 0.198],
    ["LAND", 3.8, 0.122, 0.211],
    ["PUNCH", 6.8, 0.097, 0.193],
    ["MOVE", 0.6, 0.307, 0.261],
    ["POP", 16.3, 0.121, 0.403],
    ["SWING", 16.3, 0.173, 0.576],
    ["BOUNCY", 34.6, 0.125, 0.697],
    ["FADE", 0, 0.147, 0.18],
    ["GROW", 0, 0.431, 0.53],
    ["COUNT", 0, 0.527, 0.648],
  ];

  function firstCrossing(cfg: SpringCfg, level: number) {
    let lo = 0;
    let hi = 1e-4;
    while (springAt(hi, cfg) < level) {
      lo = hi;
      hi += 1e-4;
    }
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (springAt(mid, cfg) < level) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  const cfgArb = fc.record({
    zeta: fc.double({ min: 0.2, max: 2.5, noNaN: true }),
    omega: fc.double({ min: 2, max: 60, noNaN: true }),
  });

  it("should include the contract's required presets", () => {
    expect(SPRINGS.LAND).toEqual({ zeta: 0.72, omega: 28 });
    expect(SPRINGS.SLAM).toEqual({ zeta: 0.6, omega: 30 });
    expect(SPRINGS.FADE).toEqual({ zeta: 1, omega: 32.4 });
    expect(SPRINGS.GROW).toEqual({ zeta: 1, omega: 11 });
    expect(SPRINGS.COUNT).toEqual({ zeta: 1, omega: 9 });
    expect(SPRINGS.POP).toEqual({ zeta: 0.5, omega: 20 });
    expect(SPRINGS.SOFT).toEqual({ zeta: 0.85, omega: 14 });
    expect(SPRINGS.FOLLOW).toEqual({ zeta: 0.32, omega: 9 });
  });

  it("should match the underdamped closed form for a unit step", () => {
    const { zeta, omega } = SPRINGS.LAND;
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    for (const t of [0.01, 0.05, 0.1, 0.3, 0.6]) {
      const expected =
        1 -
        Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
      expect(springAt(t, SPRINGS.LAND)).toBeCloseTo(expected, 12);
    }
  });

  it("should match the critically damped closed form for a unit step", () => {
    const { omega } = SPRINGS.FADE;
    for (const t of [0.01, 0.05, 0.2, 0.4]) {
      expect(springAt(t, SPRINGS.FADE)).toBeCloseTo(1 - (1 + omega * t) * Math.exp(-omega * t), 12);
    }
  });

  it("should reproduce the reference overshoot, landing and rest times", () => {
    for (const [name, overshootPct, lands, rest2pct] of REFERENCE) {
      const cfg = SPRINGS[name];
      let peak = 0;
      for (let t = 0; t < snapTime(cfg); t += 1e-4) peak = Math.max(peak, springAt(t, cfg));
      expect((peak - 1) * 100).toBeCloseTo(overshootPct, 1);
      const landing = firstCrossing(cfg, cfg.zeta < 1 ? 1 : 0.95);
      expect(Math.abs(landing - lands)).toBeLessThan(1.5e-3);
      expect(Math.abs(settleTime(cfg, 0.02) - rest2pct)).toBeLessThan(2e-3);
    }
  });

  it("should match the analytic overshoot for any underdamped spring", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.2, max: 0.95, noNaN: true }),
        fc.double({ min: 4, max: 40, noNaN: true }),
        (zeta, omega) => {
          const cfg = { zeta, omega };
          const tPeak = Math.PI / (omega * Math.sqrt(1 - zeta * zeta));
          const expected = Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta));
          expect(springAt(tPeak, cfg) - 1).toBeCloseTo(expected, 9);
        },
      ),
    );
  });

  it("should hold `from` before launch and snap exactly to `to` at the snap time", () => {
    expect(springAt(-1, SPRINGS.LAND, 40, 100)).toBe(40);
    expect(springAt(0, SPRINGS.LAND, 40, 100)).toBe(40);
    expect(springAt(snapTime(SPRINGS.LAND), SPRINGS.LAND, 40, 100)).toBe(100);
    expect(springAt(1e6, SPRINGS.LAND, 40, 100)).toBe(100);
    expect(snapTime(SPRINGS.LAND)).toBeCloseTo(0.794, 3);
    expect(springVelocityAt(0, SPRINGS.LAND, 0, 1, 3)).toBe(3);
    expect(springVelocityAt(10, SPRINGS.LAND)).toBe(0);
  });

  it("should report velocity matching a finite difference of position", () => {
    fc.assert(
      fc.property(
        cfgArb,
        fc.double({ min: 0.001, max: 1, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -500, max: 500, noNaN: true }),
        (cfg, frac, from, v0) => {
          const t = frac * snapTime(cfg) * 0.5;
          const h = 1e-6;
          const fd =
            (springAt(t + h, cfg, from, 10, v0) - springAt(t - h, cfg, from, 10, v0)) / (2 * h);
          const v = springVelocityAt(t, cfg, from, 10, v0);
          expect(Math.abs(v - fd)).toBeLessThan(1e-3 * (1 + Math.abs(v)));
        },
      ),
    );
  });

  it("should honor the initial velocity", () => {
    const h = 1e-6;
    for (const cfg of [SPRINGS.LAND, SPRINGS.FADE, { zeta: 1.6, omega: 10 }]) {
      const slope = springAt(h, cfg, 0, 0, 5) / h;
      expect(slope).toBeCloseTo(5, 3);
    }
  });

  it("should approach rest without overshoot when overdamped", () => {
    const cfg = { zeta: 1.8, omega: 12 };
    let prev = 0;
    for (let t = 0.01; t < snapTime(cfg); t += 0.01) {
      const x = springAt(t, cfg);
      expect(x).toBeGreaterThanOrEqual(prev);
      expect(x).toBeLessThanOrEqual(1);
      prev = x;
    }
    expect(Number.isFinite(snapTime(cfg))).toBe(true);
  });

  it("should stay within tolerance after the settle time and leave it just before", () => {
    fc.assert(
      fc.property(cfgArb, fc.constantFrom(0.001, 0.005, 0.02), (cfg, tol) => {
        const settle = settleTime(cfg, tol);
        expect(settle).toBeLessThanOrEqual(snapTime(cfg));
        for (let t = settle; t < snapTime(cfg); t += snapTime(cfg) / 500) {
          expect(Math.abs(1 - springAt(t, cfg))).toBeLessThanOrEqual(tol + 1e-9);
        }
        expect(Math.abs(1 - springAt(settle - 1e-6, cfg))).toBeGreaterThan(tol - 1e-6);
      }),
      { numRuns: 60 },
    );
  });

  it("should normalize spring eases to reach exactly 1 at u = 1", () => {
    for (const duration of [0.1, 0.3, 2]) {
      const ease = springEase(SPRINGS.LAND, duration);
      expect(ease(0)).toBe(0);
      expect(ease(-1)).toBe(0);
      expect(ease(1)).toBe(1);
      expect(ease(2)).toBe(1);
    }
    expect(springProgress(SPRINGS.LAND, 0, 0.5)).toBe(1);
  });

  it("should leave a long spring ease identical to the raw spring", () => {
    const ease = springEase(SPRINGS.FADE, 2);
    expect(ease(0.1)).toBeCloseTo(springAt(0.2, SPRINGS.FADE), 12);
  });

  it("should keep a short spring ease continuous", () => {
    const ease = springEase(SPRINGS.SLAM, 0.15);
    let prev = 0;
    for (let u = 0.01; u <= 1; u += 0.01) {
      expect(Math.abs(ease(u) - prev)).toBeLessThan(0.1);
      prev = ease(u);
    }
  });

  it("should recognise spring configs", () => {
    expect(isSpring(SPRINGS.LAND)).toBe(true);
    expect(isSpring((u: number) => u)).toBe(false);
    expect(isSpring(undefined)).toBe(false);
  });
});
