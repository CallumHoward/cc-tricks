import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";

import type { NavAction, Stop } from "#/engine/types";

import { createClock, heldStopIndex, hopsBetween, resolveTarget, stopIndexFor } from "./clock";
import { DEFAULT_TUNING, holdEnd } from "./planner";

describe("createClock", () => {
  const STOPS: Stop[] = [
    { id: "a", at: 2, holdSpan: 3 },
    { id: "b", at: 14, holdSpan: 4 },
    { id: "c", at: 22, holdSpan: 2.5, holdSpeed: 0.02 },
    { id: "d", at: 40, holdSpan: 6 },
  ];

  it("should start holding at the first stop by default", () => {
    const clock = createClock({ stops: STOPS });
    expect(clock.target).toBe(0);
    const { tau, v } = clock.sample(0);
    expect(tau).toBe(2);
    expect(v).toBeCloseTo(DEFAULT_TUNING.holdSpeed, 9);
    expect(clock.sample(1e4).tau).toBeLessThanOrEqual(holdEnd(STOPS[0] as Stop));
  });

  it("should start at a given stop index, clamped to the stops", () => {
    expect(createClock({ stops: STOPS, start: { index: 2 } }).sample(0).tau).toBe(22);
    expect(createClock({ stops: STOPS, start: { index: 99 } }).target).toBe(3);
    expect(createClock({ stops: STOPS, start: { index: -3 } }).target).toBe(0);
  });

  it("should use the stop's own hold speed when holding there", () => {
    const clock = createClock({ stops: STOPS, start: { index: 2 } });
    expect(clock.sample(1).v).toBeCloseTo(0.02, 9);
  });

  it("should head to the next stop when starting from a τ between stops", () => {
    const clock = createClock({ stops: STOPS, start: { tau: 8 } });
    expect(clock.target).toBe(1);
    expect(clock.sample(0).tau).toBe(8);
    expect(clock.sample(60).tau).toBeGreaterThanOrEqual(14);
    expect(clock.sample(60).tau).toBeLessThanOrEqual(18);
  });

  it("should hold when starting from a τ inside a hold window", () => {
    const clock = createClock({ stops: STOPS, start: { tau: 15 } });
    expect(clock.target).toBe(1);
    expect(clock.sample(100).tau).toBeLessThanOrEqual(18);
    expect(clock.sample(100).tau).toBeGreaterThan(15);
  });

  it("should apply tuning overrides", () => {
    const clock = createClock({ stops: STOPS, tuning: { holdSpeed: 0.05 } });
    expect(clock.sample(1).v).toBeCloseTo(0.05, 9);
  });

  it("should throw without stops", () => {
    expect(() => createClock({ stops: [] })).toThrow("at least one stop");
  });

  it("should advance to the next stop and notify subscribers", () => {
    const clock = createClock({ stops: STOPS });
    const listener = vi.fn<() => void>();
    clock.subscribe(listener);
    clock.dispatch({ type: "next" }, 3);
    expect(clock.target).toBe(1);
    expect(listener).toHaveBeenCalledOnce();
    const hold = clock.plan().at(-1);
    expect(hold?.kind).toBe("hold");
    expect(hold?.tau0).toBeCloseTo(14, 9);
  });

  it("should land on the stop at once when a goto is a cut", () => {
    const clock = createClock({ stops: STOPS });

    clock.dispatch({ type: "goto", index: 3, cut: true }, 5);

    expect(clock.target).toBe(3);
    expect(clock.sample(5).tau).toBeCloseTo(40, 9);
    expect(clock.sample(5).v).toBeCloseTo(DEFAULT_TUNING.holdSpeed, 9);
    expect(clock.sample(1e4).tau).toBeLessThanOrEqual(holdEnd(STOPS[3] as Stop));
  });

  it("should stop notifying after unsubscribing", () => {
    const clock = createClock({ stops: STOPS });
    const listener = vi.fn<() => void>();
    const unsubscribe = clock.subscribe(listener);
    unsubscribe();
    clock.dispatch({ type: "next" }, 1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should ignore navigation past either end", () => {
    const clock = createClock({ stops: STOPS });
    const listener = vi.fn<() => void>();
    clock.subscribe(listener);
    const before = clock.plan();
    clock.dispatch({ type: "prev" }, 1);
    clock.dispatch({ type: "first" }, 1);
    expect(clock.plan()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should move relative to the target while still travelling", () => {
    const clock = createClock({ stops: STOPS });
    clock.dispatch({ type: "next" }, 1);
    clock.dispatch({ type: "next" }, 1.1);
    expect(clock.target).toBe(2);
    clock.dispatch({ type: "last" }, 1.2);
    expect(clock.target).toBe(3);
    clock.dispatch({ type: "goto", index: 1 }, 1.3);
    expect(clock.target).toBe(1);
  });

  it("should rewind into the previous stop's hold", () => {
    const clock = createClock({ stops: STOPS, start: { index: 1 } });
    clock.dispatch({ type: "prev" }, 5);
    const late = clock.sample(60).tau;
    expect(late).toBeGreaterThanOrEqual(2);
    expect(late).toBeLessThanOrEqual(5);
  });

  it("should resolve targets for every action", () => {
    expect(resolveTarget({ type: "next" }, 1, 4)).toBe(2);
    expect(resolveTarget({ type: "next" }, 3, 4)).toBe(3);
    expect(resolveTarget({ type: "prev" }, 0, 4)).toBe(0);
    expect(resolveTarget({ type: "goto", index: 2.7 }, 0, 4)).toBe(2);
    expect(resolveTarget({ type: "goto", index: 12 }, 0, 4)).toBe(3);
    expect(resolveTarget({ type: "first" }, 3, 4)).toBe(0);
    expect(resolveTarget({ type: "last" }, 0, 4)).toBe(3);
  });

  it("should find the held stop and hop counts", () => {
    expect(heldStopIndex(STOPS, 3)).toBe(0);
    expect(heldStopIndex(STOPS, 5)).toBe(0);
    expect(heldStopIndex(STOPS, 6)).toBe(-1);
    expect(hopsBetween(STOPS, 3, STOPS[1] as Stop)).toBe(1);
    expect(hopsBetween(STOPS, 3, STOPS[3] as Stop)).toBe(3);
    expect(hopsBetween(STOPS, 41, STOPS[0] as Stop)).toBe(4);
    expect(stopIndexFor(STOPS, 1)).toBe(0);
    expect(stopIndexFor(STOPS, 30)).toBe(3);
    expect(stopIndexFor(STOPS, 90)).toBe(3);
  });

  const actionArb: fc.Arbitrary<NavAction> = fc.oneof(
    fc.constant({ type: "next" as const }),
    fc.constant({ type: "next" as const }),
    fc.constant({ type: "prev" as const }),
    fc.constant({ type: "first" as const }),
    fc.constant({ type: "last" as const }),
    fc.nat({ max: 5 }).map((index) => ({ type: "goto" as const, index })),
  );

  it("should keep τ continuous across any sequence of dispatches", () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.double({ min: 0, max: 6, noNaN: true }), actionArb), {
          maxLength: 20,
        }),
        (steps) => {
          const clock = createClock({ stops: STOPS });
          let t = 0;
          for (const [dt, action] of steps) {
            t += dt;
            const before = clock.sample(t);
            clock.dispatch(action, t);
            const after = clock.sample(t);
            expect(Math.abs(after.tau - before.tau)).toBeLessThan(1e-9);
            expect(Math.abs(after.v - before.v)).toBeLessThan(1e-9);
            expect(clock.target).toBeGreaterThanOrEqual(0);
            expect(clock.target).toBeLessThan(STOPS.length);
          }
          const target = STOPS[clock.target] as Stop;
          const settled = clock.sample(t + 1e4).tau;
          expect(settled).toBeLessThanOrEqual(holdEnd(target) + 1e-9);
          expect(settled).toBeGreaterThanOrEqual(target.at - 0.01);
        },
      ),
      { numRuns: 200, seed: 3 },
    );
  });
});
