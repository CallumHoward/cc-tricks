import { interpolatePath } from "@remotion/paths";

import { clamp, type Ease } from "./ease";
import { isSpring, settleTime, springProgress, type SpringCfg } from "./spring";

export type Channel =
  | "x"
  | "y"
  | "scale"
  | "scaleX"
  | "scaleY"
  | "rotate"
  | "opacity"
  | "blur"
  | "clipTop"
  | "clipRight"
  | "clipBottom"
  | "clipLeft"
  | `--${string}`;

/**
 * `ease` shapes the tween arriving at this key, which runs from the previous key's `at` to this
 * `at`. A spring launches at the previous key and is nudged to land exactly by this key.
 */
export type Key = { at: number; value: number; ease?: Ease | SpringCfg };

export type TrackSpec = Partial<Record<Channel, readonly Key[]>>;

export type TrackValues = Partial<Record<Channel, number>>;

type KeyInput = Key | readonly [at: number, value: number, ease?: Ease | SpringCfg];

/** Authors keyframes as objects or `[at, value, ease?]` tuples, sorted by `at`. */
export function keys(...input: KeyInput[]): readonly Key[] {
  const out = input.map((k): Key => {
    if (!Array.isArray(k)) return k as Key;
    const [at, value, ease] = k as readonly [number, number, (Ease | SpringCfg)?];
    return ease === undefined ? { at, value } : { at, value, ease };
  });
  return Object.freeze(out.sort((a, b) => a.at - b.at));
}

function tween(ease: Key["ease"], dur: number, u: number) {
  if (!ease) return u;
  return isSpring(ease) ? springProgress(ease, dur, u) : ease(u);
}

/** Value of one channel at τ; holds the first value before and the last value after its keys. */
export function sampleKeys(track: readonly Key[], tau: number): number {
  if (track.length === 0) return Number.NaN;
  const first = track[0];
  if (tau < first.at) return first.value;
  let prev = first;
  for (let i = 1; i < track.length; i++) {
    const next = track[i] as Key;
    if (tau < next.at) {
      const dur = next.at - prev.at;
      const u = clamp((tau - prev.at) / dur);
      return prev.value + (next.value - prev.value) * tween(next.ease, dur, u);
    }
    prev = next;
  }
  return prev.value;
}

/** Samples every channel at τ; pass `out` to reuse one object per element. */
export function sampleTrack(spec: TrackSpec, tau: number, out: TrackValues = {}): TrackValues {
  for (const channel in spec) {
    const track = spec[channel as Channel];
    if (track && track.length > 0) out[channel as Channel] = sampleKeys(track, tau);
  }
  return out;
}

/** Latest τ at which any channel is still moving (springs count from their settle time). */
export function lastLanding(spec: TrackSpec): number {
  let latest = Number.NEGATIVE_INFINITY;
  for (const channel in spec) {
    const track = spec[channel as Channel] ?? [];
    for (let i = 1; i < track.length; i++) {
      const prev = track[i - 1] as Key;
      const key = track[i] as Key;
      if (key.value === prev.value) continue;
      const landing = isSpring(key.ease)
        ? Math.min(key.at, prev.at + settleTime(key.ease))
        : key.at;
      latest = Math.max(latest, landing);
    }
  }
  return latest;
}

export type PathKey = { at: number; d: string; ease?: Ease };

/** Morphs between same-structure SVG paths over τ. */
export function pathTrack(input: readonly PathKey[]): (tau: number) => string {
  const sorted = [...input].sort((a, b) => a.at - b.at);
  let lastTau = Number.NaN;
  let lastD = "";
  return (tau) => {
    if (tau === lastTau) return lastD;
    lastTau = tau;
    lastD = samplePath(sorted, tau);
    return lastD;
  };
}

function samplePath(sorted: readonly PathKey[], tau: number) {
  if (sorted.length === 0) return "";
  const first = sorted[0];
  if (tau < first.at) return first.d;
  let prev = first;
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i] as PathKey;
    if (tau < next.at) {
      const u = clamp((tau - prev.at) / (next.at - prev.at));
      const e = next.ease ? next.ease(u) : u;
      if (e <= 0) return prev.d;
      if (e === 1) return next.d;
      return interpolatePath(e, prev.d, next.d);
    }
    prev = next;
  }
  return prev.d;
}
