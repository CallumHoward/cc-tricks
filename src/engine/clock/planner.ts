import type { Stop } from "#/engine/types";

/**
 * Playhead planner: turns navigation into a closed-form trajectory of story time τ over wall time
 * t. A plan is a list of segments; each lasts until the next one starts, the last is open-ended.
 */

export type PlanSegment =
  | { kind: "ramp"; t0: number; dur: number; tau0: number; v0: number; v1: number }
  | { kind: "cruise"; t0: number; tau0: number; v: number }
  | { kind: "hold"; t0: number; tau0: number; v: number; end: number; margin: number };

export type Plan = readonly PlanSegment[];

export type Playhead = { tau: number; v: number };

export type PlanStop = Pick<Stop, "at" | "holdSpan" | "holdSpeed">;

export type Tuning = {
  holdSpeed: number;
  cruise: number;
  rampUp: number;
  brake: number;
  rewind: number;
  maxSpeed: number;
  jumpTime: number;
  turn: number;
  turnSpeed: number;
  landing: number;
  boostWindow: number;
  maxBoost: number;
  margin: number;
};

export const DEFAULT_TUNING: Tuning = {
  holdSpeed: 0.07,
  cruise: 1,
  rampUp: 0.6,
  brake: 0.75,
  rewind: 2.5,
  maxSpeed: 16,
  jumpTime: 3,
  turn: 0.35,
  turnSpeed: 0.05,
  landing: 0.12,
  boostWindow: 0.9,
  maxBoost: 3,
  margin: 0.8,
};

const EPS = 1e-9;

/** Smoothstep velocity easing: e(u) and ∫₀ᵘ (1 − e) */
const ease = (u: number) => u * u * (3 - 2 * u);
const easeGap = (u: number) => u - u ** 3 + u ** 4 / 2;

function rampAt(s: Extract<PlanSegment, { kind: "ramp" }>, t: number): Playhead {
  const dt = t - s.t0;
  if (dt >= s.dur) {
    const tauEnd = s.tau0 + (s.dur * (s.v0 + s.v1)) / 2;
    return { tau: tauEnd + s.v1 * (dt - s.dur), v: s.v1 };
  }
  const u = Math.max(0, dt) / s.dur;
  return {
    tau: s.tau0 + s.v1 * u * s.dur + (s.v0 - s.v1) * s.dur * easeGap(u),
    v: s.v1 + (s.v0 - s.v1) * (1 - ease(u)),
  };
}

function holdAt(s: Extract<PlanSegment, { kind: "hold" }>, t: number): Playhead {
  const dt = Math.max(0, t - s.t0);
  const wall = s.end - s.margin;
  if (s.tau0 < wall) {
    const tWall = (wall - s.tau0) / s.v;
    if (dt < tWall) return { tau: s.tau0 + s.v * dt, v: s.v };
    const k = Math.exp((-s.v * (dt - tWall)) / s.margin);
    return { tau: s.end - s.margin * k, v: s.v * k };
  }
  const gap = s.end - s.tau0;
  if (gap <= EPS) return { tau: s.tau0, v: 0 };
  const k = Math.exp((-s.v * dt) / gap);
  return { tau: s.end - gap * k, v: s.v * k };
}

function segmentAt(s: PlanSegment, t: number): Playhead {
  switch (s.kind) {
    case "ramp":
      return rampAt(s, t);
    case "cruise":
      return { tau: s.tau0 + s.v * (t - s.t0), v: s.v };
    case "hold":
      return holdAt(s, t);
  }
}

export function evaluate(plan: Plan, t: number): Playhead {
  if (plan.length === 0) throw new Error("empty plan");
  let current = plan[0];
  for (const s of plan) {
    if (s.t0 > t) break;
    current = s;
  }
  return segmentAt(current, t);
}

/** Appends segments while tracking the trajectory end state. */
class Builder {
  readonly segs: PlanSegment[] = [];
  constructor(
    public t: number,
    public tau: number,
    public v: number,
  ) {}

  ramp(v1: number, dur: number) {
    if (dur <= EPS || Math.abs(v1 - this.v) <= EPS) {
      this.v = v1;
      return this;
    }
    this.segs.push({ kind: "ramp", t0: this.t, dur, tau0: this.tau, v0: this.v, v1 });
    this.tau += (dur * (this.v + v1)) / 2;
    this.t += dur;
    this.v = v1;
    return this;
  }

  /** Cruise at the current velocity until τ reaches the target (no-op if behind us). */
  cruiseTo(target: number) {
    const dt = (target - this.tau) / this.v;
    if (!(dt > EPS)) return this;
    this.segs.push({ kind: "cruise", t0: this.t, tau0: this.tau, v: this.v });
    this.t += dt;
    this.tau = target;
    return this;
  }

  /**
   * Travel to `target` arriving with velocity `arrive`, cruising at `peak` (same sign as the
   * travel) when there is room, otherwise solving for a lower peak.
   */
  approach(target: number, arrive: number, peak: number, tuning: Tuning): Builder {
    const dist = target - this.tau;
    if (Math.abs(dist) < 1e-3) return this.ramp(arrive, tuning.turn);
    const dir = Math.sign(dist);
    if (this.v * dir <= 0) {
      // Moving away (or stopped): come about onto a gentle heading first, slower from higher speeds.
      this.ramp(dir * tuning.turnSpeed, Math.max(tuning.turn, Math.abs(this.v) * 0.12));
      return this.approach(target, arrive, peak, tuning);
    }
    peak = dir * Math.abs(peak);
    arrive = dir * Math.abs(arrive);
    const { rampUp, brake } = tuning;
    const full = (rampUp * (this.v + peak)) / 2 + (brake * (peak + arrive)) / 2;
    if (Math.abs(full) <= Math.abs(dist)) {
      this.ramp(peak, rampUp);
      const brakeDist = (brake * (peak + arrive)) / 2;
      this.cruiseTo(target - brakeDist);
      return this.ramp(arrive, brake);
    }
    const solved = (2 * dist - rampUp * this.v - brake * arrive) / (rampUp + brake);
    if (solved * dir > Math.max(Math.abs(this.v), Math.abs(arrive))) {
      this.ramp(solved, rampUp);
      return this.ramp(arrive, brake);
    }
    // Too close for a peak: one ramp that lands exactly.
    return this.ramp(arrive, (2 * dist) / (this.v + arrive));
  }

  hold(stop: PlanStop, tuning: Tuning) {
    const v = stop.holdSpeed ?? tuning.holdSpeed;
    const end = stop.at + stop.holdSpan;
    const margin = Math.min(tuning.margin, stop.holdSpan * 0.4);
    this.segs.push({ kind: "hold", t0: this.t, tau0: this.tau, v, end, margin });
    return this.segs;
  }
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function holdEnd(stop: PlanStop): number {
  return stop.at + stop.holdSpan;
}

/**
 * Plans from the playhead at wall time `t` to `to`, departing from `from` (the stop currently held,
 * if any). `hops` is how many stops the move spans; long moves travel faster.
 */
export function plan(
  playhead: Playhead,
  t: number,
  to: PlanStop,
  from: PlanStop | undefined,
  hops: number,
  tuning: Tuning = DEFAULT_TUNING,
): Plan {
  const b = new Builder(t, playhead.tau, playhead.v);
  const holdSpeed = to.holdSpeed ?? tuning.holdSpeed;
  const margin = Math.min(tuning.margin, to.holdSpan * 0.4);
  const settled = playhead.tau + (tuning.turn * (playhead.v + holdSpeed)) / 2;

  if (playhead.tau >= to.at - EPS && settled >= to.at && settled < holdEnd(to) - margin) {
    b.ramp(holdSpeed, tuning.turn);
    return b.hold(to, tuning);
  }

  if (to.at > playhead.tau) {
    const holding =
      from &&
      from !== to &&
      Math.abs(playhead.v) < 0.25 &&
      playhead.tau >= from.at - EPS &&
      playhead.tau < holdEnd(from);
    if (holding && hops === 1) {
      // Burst through what is left of the hold window, then settle to cruise.
      const left = holdEnd(from) - playhead.tau;
      const boost = clamp(left / tuning.boostWindow, tuning.cruise, tuning.maxBoost);
      b.ramp(boost, tuning.rampUp).cruiseTo(holdEnd(from));
    }
    const dist = to.at - b.tau;
    // Natural advances play at 1x; skips and change-of-mind from a rewind travel fast.
    const fast = hops > 1 || playhead.v < -EPS;
    const peak = fast
      ? clamp(dist / tuning.jumpTime, tuning.cruise, tuning.maxSpeed)
      : tuning.cruise;
    b.approach(to.at, holdSpeed, peak, tuning);
    // An overshoot lands from above; turn round into the forwards hold.
    b.ramp(holdSpeed, tuning.turn);
    return b.hold(to, tuning);
  }

  const landing = to.at + to.holdSpan * tuning.landing;
  const dist = playhead.tau - landing;
  const peak = clamp(
    Math.max(tuning.rewind, dist / tuning.jumpTime),
    tuning.rewind,
    tuning.maxSpeed,
  );
  b.approach(landing, tuning.turnSpeed, peak, tuning);
  b.ramp(holdSpeed, tuning.turn);
  return b.hold(to, tuning);
}
