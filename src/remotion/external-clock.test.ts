import { describe, expect, it, vi } from "vitest";

import type { Stop } from "#/engine/types";
import { createExternalClock, stopIndexAt } from "#/remotion/external-clock";

const stops: Stop[] = [
  { id: "a", at: 2, holdSpan: 1 },
  { id: "b", at: 6, holdSpan: 1 },
];

describe("external clock", () => {
  it("should pick the last stop at or before tau", () => {
    expect(stopIndexAt(stops, 0)).toBe(0);
    expect(stopIndexAt(stops, 2)).toBe(0);
    expect(stopIndexAt(stops, 5.9)).toBe(0);
    expect(stopIndexAt(stops, 6)).toBe(1);
    expect(stopIndexAt([], 6)).toBe(0);
  });

  it("should sample whatever playhead was pushed in", () => {
    const clock = createExternalClock(stops, 1.5, 1);
    expect(clock.sample(99)).toEqual({ tau: 1.5, v: 1 });
    clock.set(3.25);
    expect(clock.sample(0)).toEqual({ tau: 3.25, v: 0 });
    expect(clock.plan()).toEqual([]);
  });

  it("should notify subscribers only when the target stop changes", () => {
    const clock = createExternalClock(stops);
    const listener = vi.fn<() => void>();
    const unsubscribe = clock.subscribe(listener);
    clock.set(3);
    expect(listener).not.toHaveBeenCalled();
    clock.set(6.5, 1);
    expect(clock.target).toBe(1);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    clock.set(0);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("should ignore navigation", () => {
    const clock = createExternalClock(stops, 6);
    clock.dispatch({ type: "next" }, 0);
    expect(clock.target).toBe(1);
  });
});
