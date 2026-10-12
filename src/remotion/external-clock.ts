import type { Clock } from "#/engine/clock/clock";
import type { Stop } from "#/engine/types";

export type ExternalClock = Clock & {
  /** Moves the playhead; notifies subscribers when the target stop changes */
  set(tau: number, v?: number): void;
};

/** Index of the last stop at or before τ (0 before the first stop). */
export function stopIndexAt(stops: readonly Stop[], tau: number): number {
  let index = 0;
  for (let i = 0; i < stops.length; i++) {
    if ((stops[i] as Stop).at <= tau) index = i;
  }
  return index;
}

/**
 * A Clock whose playhead is pushed in from outside (Remotion frames, stills); navigation is
 * ignored.
 */
export function createExternalClock(stops: readonly Stop[], tau = 0, v = 0): ExternalClock {
  const listeners = new Set<() => void>();
  let playhead = { tau, v };
  let target = stopIndexAt(stops, tau);

  return {
    sample: () => playhead,
    dispatch() {},
    get target() {
      return target;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    plan: () => [],
    set(nextTau, nextV = 0) {
      playhead = { tau: nextTau, v: nextV };
      const next = stopIndexAt(stops, nextTau);
      if (next === target) return;
      target = next;
      for (const listener of listeners) listener();
    },
  };
}
