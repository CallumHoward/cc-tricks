import type { NavAction, Stop } from "#/engine/types";

import {
  DEFAULT_TUNING,
  evaluate,
  holdEnd,
  plan as planTrip,
  type Plan,
  type PlanStop,
  type Tuning,
} from "./planner";

export type ClockOptions = {
  stops: readonly Stop[];
  tuning?: Partial<Tuning>;
  start?: { index: number } | { tau: number };
};

export type Clock = {
  /** `t` is wall seconds */
  sample(t: number): { tau: number; v: number };
  /** Re-plans from the playhead at wall time `t` */
  dispatch(action: NavAction, t: number): void;
  /** Index of the stop we're heading to or holding at */
  readonly target: number;
  /** Fires when `target` or the plan changes */
  subscribe(listener: () => void): () => void;
  plan(): Plan;
};

/** Index of the stop whose hold window contains τ, or -1. */
export function heldStopIndex(stops: readonly PlanStop[], tau: number): number {
  return stops.findIndex((s) => tau >= s.at && tau <= holdEnd(s));
}

/** Stops strictly between τ and the target, plus one. */
export function hopsBetween(stops: readonly PlanStop[], tau: number, to: PlanStop): number {
  const lo = Math.min(tau, to.at);
  const hi = Math.max(tau, to.at);
  let hops = 1;
  for (const s of stops) if (s.at > lo + 1e-6 && s.at < hi - 1e-6) hops++;
  return hops;
}

/** Stop index to head for when starting at an arbitrary τ. */
export function stopIndexFor(stops: readonly PlanStop[], tau: number): number {
  const held = heldStopIndex(stops, tau);
  if (held >= 0) return held;
  const ahead = stops.findIndex((s) => s.at >= tau);
  return ahead >= 0 ? ahead : stops.length - 1;
}

export function resolveTarget(action: NavAction, target: number, count: number): number {
  const clampIndex = (i: number) => Math.min(count - 1, Math.max(0, Math.trunc(i)));
  switch (action.type) {
    case "next":
      return clampIndex(target + 1);
    case "prev":
      return clampIndex(target - 1);
    case "goto":
      return clampIndex(action.index);
    case "first":
      return 0;
    case "last":
      return count - 1;
  }
}

export function createClock({ stops, tuning: overrides, start }: ClockOptions): Clock {
  if (stops.length === 0) throw new Error("createClock needs at least one stop");
  const tuning: Tuning = { ...DEFAULT_TUNING, ...overrides };
  const listeners = new Set<() => void>();
  const stopAt = (i: number) => stops[i] as Stop;

  let target: number;
  let current: Plan;
  if (start && "tau" in start) {
    target = stopIndexFor(stops, start.tau);
    const to = stopAt(target);
    const from = stops[heldStopIndex(stops, start.tau)];
    const playhead = { tau: start.tau, v: to.holdSpeed ?? tuning.holdSpeed };
    current = planTrip(playhead, 0, to, from, hopsBetween(stops, start.tau, to), tuning);
  } else {
    target = Math.min(stops.length - 1, Math.max(0, Math.trunc(start?.index ?? 0)));
    const to = stopAt(target);
    current = planTrip(
      { tau: to.at, v: to.holdSpeed ?? tuning.holdSpeed },
      0,
      to,
      undefined,
      1,
      tuning,
    );
  }

  return {
    sample: (t) => evaluate(current, t),
    dispatch(action, t) {
      const next = resolveTarget(action, target, stops.length);
      if (next === target) return;
      const to = stopAt(next);
      if (action.type === "goto" && action.cut) {
        current = planTrip(
          { tau: to.at, v: to.holdSpeed ?? tuning.holdSpeed },
          t,
          to,
          undefined,
          1,
          tuning,
        );
      } else {
        const here = evaluate(current, t);
        const from = stops[heldStopIndex(stops, here.tau)];
        current = planTrip(here, t, to, from, hopsBetween(stops, here.tau, to), tuning);
      }
      target = next;
      for (const listener of listeners) listener();
    },
    get target() {
      return target;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    plan: () => current,
  };
}
