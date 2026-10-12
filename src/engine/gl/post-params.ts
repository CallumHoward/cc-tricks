import { clamp } from "#/engine/motion/ease";
import type { Frame } from "#/engine/types";
import { noise1 } from "#/engine/util/random";

export type PostParams = {
  exposure: number;
  /** Bloom strength; only linear values above `bloomThreshold` contribute */
  bloom: number;
  bloomThreshold: number;
  bloomKnee: number;
  /** 0..1 upsample spread */
  bloomRadius: number;
  /** Warm halo around highlights; keep 0 on type-heavy stops */
  halation: number;
  /** Chromatic aberration in px at the frame edge (rewind adds to it) */
  ca: number;
  /** Grain amplitude in sRGB units; the DOM overlay owns grain by default */
  grain: number;
  vignette: number;
  /** Fade to background 0..1 */
  fade: number;
  /** Additive ivory flash; 0.006–0.04 for accents */
  flash: number;
  /** Frame offset in logical px */
  shake: readonly [number, number];
  /** Punch-in zoom (1 = none) */
  zoom: number;
};

/** Pdoom defaults retuned for our brighter background (research/pdoom-code.md §2). */
export const DEFAULT_POST: Readonly<PostParams> = Object.freeze<PostParams>({
  exposure: 1,
  bloom: 0.55,
  bloomThreshold: 1,
  bloomKnee: 0.2,
  bloomRadius: 0.75,
  halation: 0,
  ca: 0.8,
  grain: 0,
  vignette: 0.25,
  fade: 0,
  flash: 0,
  shake: [0, 0],
  zoom: 1,
});

/** Extra CA (px) at full rewind speed. */
export const REWIND_CA = 6;

/** 0..1 rewind intensity from playhead velocity; saturates around 10× reverse. */
export function rewindAmount(v: number): number {
  const r = Math.max(0, -v);
  return r === 0 ? 0 : 1 - Math.exp(-r / 4);
}

/** Exponential envelope that fires at `at` and halves every `halfLife` story seconds. */
export function pulse(tau: number, at: number, halfLife: number): number {
  return tau < at ? 0 : 2 ** (-(tau - at) / halfLife);
}

/** Deterministic shake offset in px for an envelope `amp` at τ. */
export function shakeAt(tau: number, amp: number, seed = 0): [number, number] {
  if (amp === 0) return [0, 0];
  return [noise1(tau * 47 + seed * 13.1) * amp, noise1(tau * 53 + seed * 7.7 + 101) * amp];
}

/** Final params for a frame: defaults, then layer overrides, then the rewind CA boost. */
export function resolvePost(
  frame: Frame,
  ...overrides: readonly Partial<PostParams>[]
): PostParams {
  const p: PostParams = { ...DEFAULT_POST };
  for (const o of overrides) Object.assign(p, o);
  p.ca += REWIND_CA * rewindAmount(frame.v);
  p.fade = clamp(p.fade);
  return p;
}
