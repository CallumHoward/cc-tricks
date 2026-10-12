import { inOutCubic, outCubic, smoothstep } from "#/engine/motion/ease";
import { SPRINGS, springAt } from "#/engine/motion/spring";
import { hash1 } from "#/engine/util/random";

import type { ExpressionName } from "./expressions";
import { applyExpression } from "./expressions";
import type { Arm, Pose } from "./pose";
import { mixArm, mixEye, restPose } from "./pose";
import { clampPose } from "./rig";

/** A τ-keyed action. `at` is its story-time start; `dur` its length in story seconds. */
export type Act =
  | { kind: "face"; at: number; dur: number; expr: ExpressionName }
  | { kind: "look"; at: number; dur: number; x: number; y: number }
  | { kind: "turn"; at: number; dur: number; to: number }
  | { kind: "walk"; at: number; dur: number; dx: number; stepRate?: number }
  | { kind: "hop"; at: number; height?: number; air?: number }
  | { kind: "wave"; at: number; dur: number; side?: "L" | "R" }
  | { kind: "point"; at: number; dur: number; angle: number; side?: "L" | "R" }
  | { kind: "shrug"; at: number; dur: number }
  | { kind: "celebrate"; at: number; dur: number }
  | { kind: "surprised"; at: number; dur: number }
  | { kind: "sleepy"; at: number; dur: number }
  | { kind: "carry"; at: number; dur: number }
  | { kind: "push"; at: number; dur: number; dir?: 1 | -1 }
  | { kind: "sweat"; at: number; dur: number }
  | { kind: "type"; at: number; dur: number };

export type ActKind = Act["kind"];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** 0 → 1 → 0 weight over [0, dur] with eased ramps; holds 1 for an infinite dur. */
export function envelope(t: number, dur: number, rampIn = 0.18, rampOut = 0.22): number {
  if (t <= 0 || t >= dur + rampOut) return 0;
  const up = smoothstep(clamp01(t / rampIn));
  const down = Number.isFinite(dur) ? 1 - smoothstep(clamp01((t - dur) / rampOut)) : 1;
  return Math.min(up, down);
}

export const HOP = Object.freeze({ anticipation: 0.16, air: 0.42, recover: 0.6, height: 120 });

/** Hop timing in seconds from the act start: anticipation squash, flight, impact, recovery. */
export function hopPose(t: number, height: number = HOP.height, air: number = HOP.air) {
  const A = HOP.anticipation;
  const land = A + air;
  if (t <= 0 || t >= land + HOP.recover) return { lift: 0, sq: 1, arms: 0, eyes: 0 };
  if (t < A) {
    const u = outCubic(t / A);
    return { lift: 0, sq: 1 - 0.2 * u, arms: 18 * u, eyes: -0.4 * u };
  }
  if (t < land) {
    const u = (t - A) / air;
    const sq =
      u < 0.55 ? 1.16 - 0.14 * smoothstep(u / 0.55) : 1.02 + 0.06 * smoothstep((u - 0.55) / 0.45);
    return {
      lift: 4 * height * u * (1 - u),
      sq,
      arms: -70 * Math.sin(Math.PI * Math.min(1, u * 1.4)),
      eyes: 0.25,
    };
  }
  const s = t - land;
  const sq = s < 0.05 ? 1.08 - 0.36 * (s / 0.05) : springAt(s - 0.05, SPRINGS.BOUNCY, 0.72, 1);
  const fade = 1 - smoothstep(clamp01(s / HOP.recover));
  return {
    lift: 0,
    sq: 1 + (sq - 1) * fade,
    arms: 10 * fade * Math.sin(s * 30),
    eyes: -0.3 * fade,
  };
}

/** Walk cycle on an eighth-note step: diagonal leg pairs alternate (contact → passing → up). */
export function walkPose(phase: number, stride = 18) {
  const cyc = phase - Math.floor(phase);
  const firstHalf = cyc < 0.5;
  const s = (cyc % 0.5) * 2;
  const swingFwd = -stride + 2 * stride * smoothstep(s);
  const planted = stride - 2 * stride * s;
  const lift = 11 * Math.sin(Math.PI * s);
  const swingPair = { swing: swingFwd, lift };
  const plantPair = { swing: planted, lift: 0 };
  const a = firstHalf ? swingPair : plantPair;
  const b = firstHalf ? plantPair : swingPair;
  return {
    legs: [a, b, a, b] as const,
    bob: 5.5 * Math.cos(2 * Math.PI * s) + 0.5,
    sq: 0.985 - 0.045 * Math.cos(2 * Math.PI * s),
    roll: 3 * Math.sin(2 * Math.PI * cyc),
    armSwing: 18 * Math.sin(2 * Math.PI * cyc),
  };
}

/** Ambient blink amount (0 open … 1 shut) keyed on wall time: seeded 2.2–5 s gaps, some doubles. */
export function blinkAt(w: number): number {
  const slot = 3.6;
  const k = Math.floor(w / slot);
  const local = w - k * slot;
  const start = 0.3 + hash1(k) * 2.8;
  const one = (x: number) => (x > 0 && x < 0.14 ? Math.sin((x / 0.14) * Math.PI) : 0);
  const twice = hash1(k + 977) < 0.22 ? one(local - start - 0.24) : 0;
  return Math.max(one(local - start), twice);
}

export function breatheAt(w: number, period = 3.4, depth = 0.018): number {
  return 1 + depth * Math.sin((2 * Math.PI * w) / period);
}

function addArm(arm: Arm, rot: number, k: number) {
  arm.rot += rot * k;
}

function applyAct(p: Pose, act: Act, tau: number): void {
  const t = tau - act.at;
  if (t <= 0) return;
  switch (act.kind) {
    case "face":
      applyExpression(p, act.expr, envelope(t, act.dur, 0.12, 0.16));
      return;
    case "look": {
      const k = envelope(t, act.dur, 0.12, 0.2);
      const lag = envelope(t - 0.08, act.dur, 0.25, 0.25);
      p.lookX += (act.x - p.lookX) * k;
      p.lookY += (act.y - p.lookY) * k;
      p.lean += 3 * act.x * lag;
      return;
    }
    case "turn":
      return;
    case "walk": {
      const k = envelope(t, act.dur, 0.1, 0.15);
      if (k <= 0) return;
      const rate = act.stepRate ?? 4;
      const w = walkPose(Math.min(t, act.dur) * (rate / 2));
      const dir = Math.sign(act.dx) || 1;
      w.legs.forEach((leg, i) => {
        p.legs[i].swing += leg.swing * k;
        p.legs[i].lift += leg.lift * k;
      });
      p.bob += w.bob * k;
      p.sq *= 1 + (w.sq - 1) * k;
      p.lean += (dir * 5 * Math.abs(Math.sin((p.yaw * Math.PI) / 180)) + w.roll) * k;
      addArm(p.armL, w.armSwing, k);
      addArm(p.armR, -w.armSwing, k);
      p.armL.fwd += w.armSwing * 1.4 * k;
      p.armR.fwd -= w.armSwing * 1.4 * k;
      return;
    }
    case "hop": {
      const h = hopPose(t, act.height, act.air);
      p.lift += h.lift;
      p.sq *= h.sq;
      addArm(p.armL, h.arms, 1);
      addArm(p.armR, h.arms, 1);
      mixEye(p.eyeL, { open: 1 + h.eyes, size: 1 + Math.max(0, h.eyes) * 0.4 }, 1);
      mixEye(p.eyeR, { open: 1 + h.eyes, size: 1 + Math.max(0, h.eyes) * 0.4 }, 1);
      return;
    }
    case "wave": {
      const k = envelope(t, act.dur, 0.2, 0.25);
      const arm = act.side === "L" ? p.armL : p.armR;
      mixArm(arm, { rot: -66 + 24 * Math.sin(t * 2 * Math.PI * 2.4), len: 1.3 }, k);
      p.lean += (act.side === "L" ? -3 : 3) * Math.sin(t * 2 * Math.PI * 1.2) * k;
      applyExpression(p, "happy", k);
      return;
    }
    case "point": {
      const k = envelope(t, act.dur, 0.22, 0.25);
      const pull = Math.sin(clamp01(t / 0.12) * Math.PI) * (1 - clamp01(t / 0.24));
      const arm = act.side === "L" ? p.armL : p.armR;
      mixArm(arm, { rot: act.angle + 20 * pull, len: 1.45 - 0.3 * pull }, k);
      const sign = act.side === "L" ? -1 : 1;
      p.lookX += (sign * 0.9 - p.lookX) * k;
      p.lookY += (Math.sin((act.angle * Math.PI) / 180) * 0.6 - p.lookY) * k;
      p.lean += sign * 4 * k;
      return;
    }
    case "shrug": {
      const k = envelope(t, act.dur, 0.2, 0.25);
      mixArm(p.armL, { rot: -38, len: 0.95 }, k);
      mixArm(p.armR, { rot: -38, len: 0.95 }, k);
      p.bob -= 6 * k;
      p.sq *= 1 + 0.04 * k;
      p.lean += 5 * k;
      applyExpression(p, "sideEye", k * 0.8);
      if (k > 0.5) p.mouth = "wavy";
      return;
    }
    case "celebrate": {
      const k = envelope(t, act.dur, 0.15, 0.25);
      const beat = (t * 2) % 1;
      const h = hopPose(beat * 0.5 + 0.0, 46, 0.3);
      p.lift += h.lift * k;
      p.sq *= 1 + (h.sq - 1) * k;
      const wiggle = 14 * Math.sin(t * 2 * Math.PI * 4);
      mixArm(p.armL, { rot: -58 + wiggle, len: 1.15 }, k);
      mixArm(p.armR, { rot: -58 - wiggle, len: 1.15 }, k);
      applyExpression(p, "joy", k);
      if (k > 0) p.fx.sparkle = 1e-3 + ((t * 0.9) % 1);
      return;
    }
    case "surprised": {
      const k = envelope(t, act.dur, 0.06, 0.3);
      const jolt = springAt(t, SPRINGS.POP, 1.16, 1);
      p.sq *= 1 + (jolt - 1) * k;
      p.lift += 14 * Math.sin(clamp01(t / 0.3) * Math.PI) * k;
      mixArm(p.armL, { rot: -24, len: 1.1 }, k);
      mixArm(p.armR, { rot: -24, len: 1.1 }, k);
      applyExpression(p, "surprised", k);
      p.fx.alert = Math.max(p.fx.alert, springAt(t, SPRINGS.POP_CARTOON) * k);
      return;
    }
    case "sleepy": {
      const k = envelope(t, act.dur, 0.6, 0.3);
      applyExpression(p, "sleepy", k);
      p.sq *= 1 + 0.025 * Math.sin(t * 2 * Math.PI * 0.25) * k;
      p.lean += 3 * Math.sin(t * 2 * Math.PI * 0.18) * k;
      mixArm(p.armL, { rot: 55, len: 0.9 }, k);
      mixArm(p.armR, { rot: 55, len: 0.9 }, k);
      if (k > 0.05) p.fx.zzz = 1e-3 + ((t * 0.45) % 1);
      return;
    }
    case "carry": {
      const k = envelope(t, act.dur, 0.25, 0.25);
      mixArm(p.armL, { rot: -72, len: 1.25 }, k);
      mixArm(p.armR, { rot: -72, len: 1.25 }, k);
      p.sq *= 1 - 0.05 * k;
      applyExpression(p, "determined", k * 0.7);
      if (k > 0.5) p.prop = "box";
      return;
    }
    case "push": {
      const k = envelope(t, act.dur, 0.25, 0.25);
      const dir = act.dir ?? 1;
      const lead = dir > 0 ? p.armR : p.armL;
      const trail = dir > 0 ? p.armL : p.armR;
      mixArm(lead, { rot: -4, len: 1.25 }, k);
      mixArm(trail, { rot: 30, len: 1, fwd: 40 }, k);
      p.lean += dir * 12 * k;
      const strain = walkPose(t * 1.5, 6);
      strain.legs.forEach((leg, i) => {
        p.legs[i].lift += leg.lift * 0.5 * k;
      });
      applyExpression(p, "determined", k);
      if (k > 0.05) p.fx.sweat = 1e-3 + ((t * 0.8) % 1);
      if (k > 0.5) {
        p.prop = "crate";
        p.propReach = dir * 152;
      }
      return;
    }
    case "sweat": {
      const k = envelope(t, act.dur, 0.1, 0.1);
      if (k > 0.05) p.fx.sweat = 1e-3 + ((t * 0.8) % 1);
      return;
    }
    case "type": {
      const k = envelope(t, act.dur, 0.2, 0.25);
      const tap = (ph: number) => Math.max(0, Math.sin(t * 2 * Math.PI * 5 + ph));
      mixArm(p.armL, { rot: 58 + 14 * tap(0), len: 1.1, fwd: 70 }, k);
      mixArm(p.armR, { rot: 58 + 14 * tap(Math.PI), len: 1.1, fwd: 70 }, k);
      p.bob += 1.5 * (tap(0) + tap(Math.PI)) * k;
      p.lookY += (0.7 - p.lookY) * k;
      mixEye(p.eyeL, { open: 0.75, slant: 0.4 }, k);
      mixEye(p.eyeR, { open: 0.75, slant: 0.4 }, k);
      if (k > 0.5) p.prop = "keyboard";
      return;
    }
  }
}

/** Persistent state accumulated from finished-or-running acts: facing and walked distance. */
function baseline(acts: readonly Act[], tau: number) {
  let yaw = 0;
  let x = 0;
  for (const act of acts) {
    const t = tau - act.at;
    if (t <= 0) continue;
    if (act.kind === "turn") {
      const u = act.dur > 0 ? inOutCubic(clamp01(t / act.dur)) : 1;
      yaw += (act.to - yaw) * u;
    } else if (act.kind === "walk") {
      const u = act.dur > 0 ? clamp01(t / act.dur) : 1;
      const ramp = 0.12 / Math.max(act.dur, 0.24);
      x += act.dx * easeTravel(u, ramp);
    }
  }
  return { yaw, x };
}

/** Linear travel with short eased ramps at each end; continuous and monotone. */
export function easeTravel(u: number, ramp: number): number {
  const r = Math.min(0.5, Math.max(1e-6, ramp));
  const v = 1 / (1 - r);
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  if (u < r) return (v * u * u) / (2 * r);
  if (u > 1 - r) return 1 - (v * (1 - u) ** 2) / (2 * r);
  return v * (u - r / 2);
}

export type PoseOptions = {
  /** Wall-time breathing and blinking (default true) */
  ambient?: boolean;
};

/** Pure pose at story time τ (acts) and wall time w (ambient breathe/blink). */
export function poseAt(acts: readonly Act[], tau: number, w: number, opts: PoseOptions = {}): Pose {
  const p = restPose();
  const base = baseline(acts, tau);
  p.yaw = base.yaw;
  p.x = base.x;
  for (const act of acts) applyAct(p, act, tau);
  if (opts.ambient ?? true) {
    const breath = breatheAt(w);
    p.sq *= breath;
    p.armL.rot += (breath - 1) * 120;
    p.armR.rot += (breath - 1) * 120;
    const blink = blinkAt(w);
    p.eyeL.open *= 1 - blink;
    p.eyeR.open *= 1 - blink;
  }
  return clampPose(p);
}

/** Drawing cadence on twos (12/s): keyed on τ at speed, on wall time in slo-mo so poses still creep. */
export function twosKey(tau: number, w: number, v: number): number {
  return Math.abs(v) >= 0.5 ? Math.floor(tau * 12) : -1 - Math.floor(w * 12);
}

/** Boil drawing index (cycle of three, on twos, wall-time keyed). */
export function boilIndex(w: number): number {
  return Math.floor(w * 12) % 3;
}
