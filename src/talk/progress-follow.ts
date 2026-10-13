import { springAt, springVelocityAt, type SpringCfg } from "#/engine/motion/spring";

/** Critically damped lag on top of the speed ramp, so jumps glide instead of snapping. */
const FOLLOW: SpringCfg = { zeta: 1, omega: 9 };
/** Longest frame step the follow integrates, so a stalled tab doesn't lurch. */
const MAX_DT = 0.1;

export type Follow = { x: number; v: number };

/** Share of the film played at story time τ. */
export function talkProgress(tau: number, end: number): number {
  return end > 0 ? Math.min(1, Math.max(0, tau / end)) : 0;
}

/** One frame of the bar chasing `target`; starts at rest on it. */
export function followProgress(prev: Follow | null, target: number, dt: number): Follow {
  const s = prev ?? { x: target, v: 0 };
  const step = Math.min(dt, MAX_DT);
  return {
    x: springAt(step, FOLLOW, s.x, target, s.v),
    v: springVelocityAt(step, FOLLOW, s.x, target, s.v),
  };
}
