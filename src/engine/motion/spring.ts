import type { Ease } from "./ease";

/** Damped spring with unit mass: stiffness ω², damping 2ζω. */
export type SpringCfg = { readonly omega: number; readonly zeta: number };

const spring = (zeta: number, omega: number): SpringCfg => Object.freeze({ zeta, omega });

/**
 * Presets from research/motion-bible.md §1.2 (entrances overshoot; exits, opacity and data use ζ =
 * 1).
 */
export const SPRINGS = Object.freeze({
  SLAM: spring(0.6, 30),
  LAND: spring(0.72, 28),
  PUNCH: spring(0.65, 31),
  LIFT: spring(0.78, 12),
  TOAST: spring(0.7, 20),
  KNOB: spring(0.7, 28),
  SNAP: spring(0.7, 38),
  HOP: spring(0.8, 22),
  FLIP: spring(0.55, 12),
  SETTLE: spring(0.62, 9),
  REFORM: spring(0.62, 10),
  GATHER: spring(0.78, 7.2),
  POP: spring(0.5, 20),
  POP_CAPTION: spring(0.5, 26),
  POP_CARTOON: spring(0.42, 20),
  SWING: spring(0.5, 14),
  BOUNCY: spring(0.32, 16),
  RELEASE: spring(0.5, 26),
  FOLLOW: spring(0.32, 9),
  LINE: spring(0.8, 15.6),
  MOVE: spring(0.85, 16),
  SOFT: spring(0.85, 14),
  CURSOR: spring(0.9, 18),
  EXPAND: spring(0.86, 14),
  SCROLL: spring(0.8, 9),
  SLIDE: spring(0.85, 34),
  FADE: spring(1, 32.4),
  PRESS: spring(1, 50),
  HI: spring(1, 40),
  QUICK: spring(1, 24),
  CLOSE: spring(1, 22),
  TICK: spring(1, 26),
  PUSH: spring(1, 20),
  FOCUS: spring(1, 19.5),
  LEAD: spring(1, 18),
  DRAG: spring(1, 16),
  DROP: spring(1, 14),
  GLIDE: spring(1, 12),
  GROW: spring(1, 11),
  TRACE: spring(1, 10),
  COUNT: spring(1, 9),
  SWEEP: spring(1, 8),
  DISSOLVE: spring(1, 4.5),
  DOLLY: spring(1, 3.2),
});

/** Slowest decay rate of the homogeneous solution. */
function decayRate({ zeta, omega }: SpringCfg) {
  return zeta <= 1 ? zeta * omega : omega * (zeta - Math.sqrt(zeta * zeta - 1));
}

/** Time after which the value snaps exactly to rest (residual below ~1e-7 of the travel). */
export function snapTime(cfg: SpringCfg): number {
  return 16 / decayRate(cfg);
}

/** Displacement from rest and its velocity at time t, for x(0) = x0 and x'(0) = v0. */
function solve({ zeta, omega }: SpringCfg, t: number, x0: number, v0: number): [number, number] {
  if (zeta < 1) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    const decay = zeta * omega;
    const e = Math.exp(-decay * t);
    const c = Math.cos(wd * t);
    const s = Math.sin(wd * t);
    const b = (v0 + decay * x0) / wd;
    return [e * (x0 * c + b * s), e * (v0 * c - ((omega * omega * x0 + decay * v0) / wd) * s)];
  }
  if (zeta === 1) {
    const e = Math.exp(-omega * t);
    const b = v0 + omega * x0;
    return [e * (x0 + b * t), e * (v0 - omega * b * t)];
  }
  const root = Math.sqrt(zeta * zeta - 1);
  const r1 = -omega * (zeta - root);
  const r2 = -omega * (zeta + root);
  const a = (v0 - r2 * x0) / (r1 - r2);
  const b = x0 - a;
  const e1 = Math.exp(r1 * t);
  const e2 = Math.exp(r2 * t);
  return [a * e1 + b * e2, a * r1 * e1 + b * r2 * e2];
}

/**
 * Closed-form spring position at t seconds after launch; exactly `from` before and `to` after
 * snapTime.
 */
export function springAt(t: number, cfg: SpringCfg, from = 0, to = 1, v0 = 0): number {
  if (t <= 0) return from;
  if (t >= snapTime(cfg)) return to;
  return to + solve(cfg, t, from - to, v0)[0];
}

export function springVelocityAt(t: number, cfg: SpringCfg, from = 0, to = 1, v0 = 0): number {
  if (t <= 0) return v0;
  if (t >= snapTime(cfg)) return 0;
  return solve(cfg, t, from - to, v0)[1];
}

const settleCache = new Map<string, number>();

/** Last time the unit step response is further than `tolerance` from rest. */
export function settleTime(cfg: SpringCfg, tolerance = 0.005): number {
  const key = `${cfg.zeta}:${cfg.omega}:${tolerance}`;
  const cached = settleCache.get(key);
  if (cached !== undefined) return cached;
  const end = snapTime(cfg);
  const h = Math.min(1e-3, end / 2000);
  const outside = (t: number) => Math.abs(1 - springAt(t, cfg)) > tolerance;
  let lastOut = 0;
  for (let t = 0; t < end; t += h) if (outside(t)) lastOut = t;
  let lo = lastOut;
  let hi = Math.min(end, lastOut + h);
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (outside(mid)) lo = mid;
    else hi = mid;
  }
  settleCache.set(key, hi);
  return hi;
}

/** Spring step response over `duration`, nudged to land exactly at u = 1. */
export function springProgress(cfg: SpringCfg, duration: number, u: number): number {
  if (u <= 0) return 0;
  if (u >= 1 || duration <= 0) return 1;
  const miss = 1 - springAt(duration, cfg);
  return springAt(u * duration, cfg) + miss * u * u;
}

export function springEase(cfg: SpringCfg, duration: number): Ease {
  return (u) => springProgress(cfg, duration, u);
}

export function isSpring(ease: unknown): ease is SpringCfg {
  return typeof ease === "object" && ease !== null && "omega" in ease && "zeta" in ease;
}
