import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { mulberry32 } from "#/engine/util/random";

import {
  DEFAULT_TUNING,
  evaluate,
  holdEnd,
  plan,
  type Plan,
  type PlanStop,
  type Playhead,
} from "./planner";

describe("planner", () => {
  const HOLD = DEFAULT_TUNING.holdSpeed;

  const STOPS: PlanStop[] = [
    { at: 2, holdSpan: 3 },
    { at: 14, holdSpan: 4 },
    { at: 22, holdSpan: 2.5 },
    { at: 40, holdSpan: 6 },
    { at: 47, holdSpan: 3 },
    { at: 75, holdSpan: 3 },
  ];

  function stop(i: number): PlanStop {
    if (i < 0 || i >= STOPS.length) throw new Error(`no stop ${i}`);
    return STOPS[i];
  }

  function last(p: Plan) {
    const s = p.at(-1);
    if (!s) throw new Error("empty plan");
    return s;
  }

  function sample(p: Plan, t0: number, t1: number, step = 1 / 240) {
    const out: (Playhead & { t: number })[] = [];
    for (let t = t0; t <= t1; t += step) out.push({ t, ...evaluate(p, t) });
    return out;
  }

  /** Largest jump in τ or v across segment boundaries. */
  function discontinuity(p: Plan) {
    let worst = 0;
    for (const s of p.slice(1)) {
      const before = evaluate(
        p.filter((x) => x.t0 < s.t0),
        s.t0,
      );
      const after = evaluate(p, s.t0);
      worst = Math.max(worst, Math.abs(before.tau - after.tau), Math.abs(before.v - after.v));
    }
    return worst;
  }

  function heldStop(stops: readonly PlanStop[], tau: number) {
    return stops.find((s) => tau >= s.at && tau <= holdEnd(s));
  }

  function hopsBetween(stops: readonly PlanStop[], tau: number, to: PlanStop) {
    const lo = Math.min(tau, to.at);
    const hi = Math.max(tau, to.at);
    return 1 + stops.filter((s) => s.at > lo + 1e-6 && s.at < hi - 1e-6).length;
  }

  it("should land exactly on the next stop at hold speed", () => {
    const p = plan({ tau: stop(0).at + 0.5, v: HOLD }, 100, stop(1), stop(0), 1);
    const hold = last(p);
    expect(hold.kind).toBe("hold");
    expect(hold.tau0).toBeCloseTo(stop(1).at, 9);
    expect(evaluate(p, hold.t0).v).toBeCloseTo(HOLD, 9);
    expect(discontinuity(p)).toBeLessThan(1e-9);
  });

  it("should default the hold speed to 0.035", () => {
    expect(DEFAULT_TUNING.holdSpeed).toBe(0.035);
  });

  it("should never leave the hold window however long the presenter talks", () => {
    const p = plan({ tau: 2.1, v: HOLD }, 0, stop(1), stop(0), 1);
    const end = holdEnd(stop(1));
    for (const t of [10, 60, 300, 3600, 36_000]) {
      expect(evaluate(p, t).tau).toBeLessThanOrEqual(end);
    }
    expect(evaluate(p, 60).v).toBeGreaterThan(0);
  });

  it("should keep creeping forwards while holding", () => {
    const p = plan({ tau: stop(0).at, v: HOLD }, 0, stop(0), undefined, 1);
    const a = evaluate(p, 1).tau;
    const b = evaluate(p, 2).tau;
    expect(b).toBeGreaterThan(a);
    expect(b - a).toBeCloseTo(HOLD, 6);
  });

  it("should approach the hold end asymptotically when starting inside its margin", () => {
    const p: Plan = [{ kind: "hold", t0: 0, tau0: 0.9, v: HOLD, end: 1, margin: 0.4 }];
    const late = evaluate(p, 1e3);
    expect(late.tau).toBeLessThanOrEqual(1);
    expect(late.tau).toBeGreaterThan(0.99);
    expect(late.v).toBeGreaterThan(0);
    expect(evaluate([{ kind: "hold", t0: 0, tau0: 1, v: HOLD, end: 1, margin: 0.4 }], 5)).toEqual({
      tau: 1,
      v: 0,
    });
  });

  it("should rewind to the previous stop without crossing below it, then hold forwards", () => {
    const p = plan({ tau: 14.3, v: HOLD }, 0, stop(0), stop(1), 1);
    const s = sample(p, 0, 30);
    expect(Math.min(...s.map((x) => x.tau))).toBeGreaterThan(stop(0).at);
    const end = s.at(-1);
    expect(end?.v).toBeGreaterThan(0);
    expect(end?.tau).toBeLessThanOrEqual(holdEnd(stop(0)));
    expect(discontinuity(p)).toBeLessThan(1e-9);
  });

  it("should rewind at no less than the rewind speed", () => {
    const p = plan({ tau: 14.3, v: HOLD }, 0, stop(0), stop(1), 1);
    const fastest = Math.min(...sample(p, 0, 10).map((x) => x.v));
    expect(fastest).toBeLessThanOrEqual(-DEFAULT_TUNING.rewind + 1e-9);
  });

  it("should travel faster for multi-stop jumps than for single advances", () => {
    const next = plan({ tau: 2.4, v: HOLD }, 0, stop(1), stop(0), 1);
    const jump = plan({ tau: 2.4, v: HOLD }, 0, stop(5), stop(0), 5);
    const peak = (p: Plan) => Math.max(...sample(p, 0, last(p).t0, 1 / 30).map((x) => x.v));
    expect(peak(next)).toBeLessThanOrEqual(DEFAULT_TUNING.maxBoost + 1e-9);
    expect(peak(jump)).toBeGreaterThan(peak(next));
    expect(peak(jump)).toBeLessThanOrEqual(DEFAULT_TUNING.maxSpeed + 1e-9);
  });

  it("should keep trips within presentable wall times", () => {
    const next = last(plan({ tau: 2.4, v: HOLD }, 0, stop(1), stop(0), 1)).t0;
    const back = last(plan({ tau: 14.5, v: HOLD }, 0, stop(0), stop(1), 1)).t0;
    const jump = last(plan({ tau: 2.4, v: HOLD }, 0, stop(5), stop(0), 5)).t0;
    expect(next).toBeGreaterThan(5);
    expect(next).toBeLessThan(15);
    expect(back).toBeLessThan(6);
    expect(jump).toBeLessThan(10);
  });

  it("should come about smoothly when told to advance while rewinding", () => {
    const back = plan({ tau: 14.5, v: HOLD }, 0, stop(0), stop(1), 1);
    const here = evaluate(back, 0.8);
    expect(here.v).toBeLessThan(0);
    const p = plan(here, 0.8, stop(1), undefined, 1);
    expect(discontinuity(p)).toBeLessThan(1e-9);
    const start = evaluate(p, 0.8);
    expect(start.tau).toBeCloseTo(here.tau, 9);
    expect(start.v).toBeCloseTo(here.v, 9);
    expect(evaluate(p, 1e4).tau).toBeGreaterThanOrEqual(stop(1).at);
  });

  it("should keep τ and v continuous and bounded for random navigation", () => {
    const rnd = mulberry32(7);
    for (let trial = 0; trial < 150; trial++) {
      let t = 0;
      let idx = 0;
      let current = plan({ tau: stop(0).at, v: HOLD }, t, stop(0), undefined, 1);
      for (let step = 0; step < 12; step++) {
        t += rnd() * 6;
        const here = evaluate(current, t);
        const from = STOPS[idx];
        const delta = Math.floor(rnd() * 5) - 2 || 1;
        idx = Math.min(STOPS.length - 1, Math.max(0, idx + delta));
        current = plan(here, t, stop(idx), from, Math.abs(delta));
        expect(discontinuity(current)).toBeLessThan(1e-7);
        const start = evaluate(current, t);
        expect(Math.abs(start.tau - here.tau)).toBeLessThan(1e-9);
        expect(Math.abs(start.v - here.v)).toBeLessThan(1e-9);
        const late = evaluate(current, t + 500);
        expect(late.tau).toBeLessThanOrEqual(holdEnd(stop(idx)) + 1e-9);
        expect(late.tau).toBeGreaterThanOrEqual(stop(idx).at - 0.01);
      }
    }
  });

  it("should throw when evaluating an empty plan", () => {
    expect(() => evaluate([], 0)).toThrow("empty plan");
  });

  const layoutArb = fc
    .record({
      start: fc.double({ min: 0, max: 3, noNaN: true }),
      stops: fc.array(
        fc.record({
          holdSpan: fc.double({ min: 0.6, max: 6.6, noNaN: true }),
          gap: fc.double({ min: 0.5, max: 20.5, noNaN: true }),
        }),
        { minLength: 3, maxLength: 14 },
      ),
    })
    .map(({ start, stops }) => {
      let at = start;
      return stops.map(({ holdSpan, gap }) => {
        const s = { at, holdSpan };
        at += holdSpan + gap;
        return s;
      });
    });

  const navArb = fc.array(
    fc.record({
      // Frantic clicks (< 0.15 s) mixed with normal pacing.
      dt: fc.oneof(
        fc.double({ min: 0, max: 0.15, noNaN: true }),
        fc.double({ min: 0, max: 8, noNaN: true }),
      ),
      move: fc.oneof(
        fc.constant<"next" | "prev">("next"),
        fc.constant<"next" | "prev">("prev"),
        fc.nat({ max: 20 }),
      ),
    }),
    { minLength: 1, maxLength: 25 },
  );

  it("should stay continuous, bounded and prompt for random layouts and frantic clicking", () => {
    fc.assert(
      fc.property(layoutArb, navArb, (stops, nav) => {
        const first = stops[0];
        let t = 0;
        let idx = 0;
        let p = plan({ tau: first.at, v: HOLD }, t, first, undefined, 1);
        for (const { dt, move } of nav) {
          t += dt;
          const here = evaluate(p, t);
          const prev = idx;
          idx = move === "next" ? idx + 1 : move === "prev" ? idx - 1 : move % stops.length;
          idx = Math.min(stops.length - 1, Math.max(0, idx));
          if (idx === prev) continue;
          const to = stops[idx];
          p = plan(here, t, to, heldStop(stops, here.tau), hopsBetween(stops, here.tau, to));

          expect(discontinuity(p)).toBeLessThan(1e-7);
          const start = evaluate(p, t);
          expect(Math.abs(start.tau - here.tau)).toBeLessThan(1e-9);
          expect(Math.abs(start.v - here.v)).toBeLessThan(1e-9);

          const end = last(p);
          expect(Number.isFinite(end.t0)).toBe(true);
          expect(end.t0 - t).toBeLessThanOrEqual(30);
          const final = evaluate(p, end.t0 + 1e5).tau;
          expect(final).toBeLessThanOrEqual(holdEnd(to) + 1e-9);
          expect(final).toBeGreaterThanOrEqual(to.at - 0.01);
        }
      }),
      { numRuns: 250, seed: 42 },
    );
  });

  it("should never exceed the hold end at any sampled instant after arriving", () => {
    fc.assert(
      fc.property(
        layoutArb,
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (stops, fromFrac, toFrac) => {
          const fi = Math.floor(fromFrac * (stops.length - 1));
          const ti = Math.floor(toFrac * (stops.length - 1));
          const from = stops[fi];
          const to = stops[ti];
          const p = plan({ tau: from.at, v: HOLD }, 0, to, from, Math.abs(ti - fi) || 1);
          const arrive = last(p).t0;
          for (const dt of [0, 0.5, 2, 10, 100, 1e4]) {
            const { tau } = evaluate(p, arrive + dt);
            expect(tau).toBeLessThanOrEqual(holdEnd(to) + 1e-9);
            expect(tau).toBeGreaterThanOrEqual(to.at - 0.01);
          }
        },
      ),
      { numRuns: 200, seed: 7 },
    );
  });
});
