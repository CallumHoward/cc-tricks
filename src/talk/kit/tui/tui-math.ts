import { clamp, inOutExpo, outCubic, prog, smootherstep } from "#/engine/motion/ease";
import { sampleKeys, type Key } from "#/engine/motion/track";
import { hash1 } from "#/engine/util/random";

import type { SpinnerGlyph } from "./glyph-data";

/** Discrete τ state (typing, counters) steps at 60 Hz so stills and playback agree. */
export const quantize = (tau: number): number => Math.ceil(tau * 60 - 1e-6) / 60;

/** Whole characters typed by τ when typing `len` chars at `cps` from `start`. */
export function typedChars(tau: number, start: number, cps: number, len: number): number {
  if (tau < start) return 0;
  return clamp(Math.floor((quantize(tau) - start) * cps + 1e-6), 0, len);
}

export const typeEnd = (start: number, len: number, cps: number): number => start + len / cps;

/** Length in user-perceived characters (é, ✻ count once). */
export const charLength = (text: string): number => Array.from(text).length;

export const sliceChars = (text: string, n: number): string =>
  Array.from(text).slice(0, n).join("");

export const SPINNER_FRAMES: readonly SpinnerGlyph[] = [
  "·",
  "✢",
  "✳",
  "✶",
  "✻",
  "✽",
  "✽",
  "✻",
  "✶",
  "✳",
  "✢",
  "·",
];

const SPINNER_STEP = 0.12;

/** Ping-pong spinner glyph at wall time `w` (120 ms per frame × `rate`). */
export function spinnerGlyph(w: number, rate = 1): SpinnerGlyph {
  const n = SPINNER_FRAMES.length;
  const i = Math.floor((w * rate) / SPINNER_STEP + 1e-9);
  return SPINNER_FRAMES[((i % n) + n) % n] as SpinnerGlyph;
}

export const PAST_VERBS = [
  "Baked",
  "Brewed",
  "Churned",
  "Cogitated",
  "Cooked",
  "Crunched",
  "Sautéed",
  "Worked",
] as const;

export type PastVerb = (typeof PAST_VERBS)[number];

export const REWIND_VERB = "Moonwalking";

/** A verb that takes over at story time `at`. */
export type VerbKey = { at: number; verb: string };

export type VerbSource = string | readonly VerbKey[];

/** The spinner verb at τ; rewinding always reads `Moonwalking`. */
export function spinnerVerb(source: VerbSource, tau: number, v: number): string {
  if (v < 0) return REWIND_VERB;
  if (typeof source === "string") return source;
  let verb = source[0]?.verb ?? "";
  for (const key of source) if (tau >= key.at) verb = key.verb;
  return verb;
}

/** `45s`, `1m 30s`, `1m`, `29m 29s`, `1h 2m`. */
export function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds + 1e-6));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest === 0 ? `${m}m` : `${m}m ${rest}s`;
  const h = Math.floor(m / 60);
  return m % 60 === 0 ? `${h}h` : `${h}h ${m % 60}m`;
}

/** A token count as the counter's drums show it: digits of `scaled`, `decimals` after the point. */
export type TokenScale = { scaled: number; decimals: number; unit: "" | "k" | "M" };

export function tokenScale(n: number): TokenScale {
  const v = Math.max(0, n);
  if (v < 1000) return { scaled: v, decimals: 0, unit: "" };
  if (v < 999_950) return { scaled: v / 100, decimals: 1, unit: "k" };
  return { scaled: v / 10_000, decimals: 2, unit: "M" };
}

const EPS = 1e-6;

/** `0`, `999`, `1.2k`, `97.3k`, `1.03M` (truncated, matching the drums at rest). */
export function formatTokens(n: number): string {
  const { scaled, decimals, unit } = tokenScale(n);
  const int = Math.floor(scaled + EPS);
  if (decimals === 0) return `${int}${unit}`;
  const digits = String(int).padStart(decimals + 1, "0");
  return `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}${unit}`;
}

/** Drum roll inside one unit step: dwells on the digit, then snaps to the next (the detent). */
export const detent = (frac: number): number => smootherstep(prog(frac, 0.55, 1));

export type DrumSlot = {
  /** Continuous drum position in digits, 0–10 (10 shows the wrapped 0) */
  pos: number;
  /** Slot width in cells, 0–1; a new leading digit widens in as it rolls 0 → 1 */
  width: number;
  /** Speed blur 0–1 for ghost copies */
  blur: number;
};

const digitCount = (n: number) => (n < 1 ? 1 : Math.floor(Math.log10(n) + EPS) + 1);

/**
 * Odometer slots, least significant first. Higher drums only move while every lower drum is rolling
 * 9 → 0, so carries cascade like a real odometer.
 */
export function drumSlots(scaled: number, minDigits: number, slots: number, speed = 0): DrumSlot[] {
  const value = Math.max(0, scaled);
  const int = Math.floor(value + EPS);
  const roll = detent(value - int);
  const shown = Math.max(minDigits, digitCount(int));
  const out: DrumSlot[] = [];
  let place = 1;
  for (let k = 0; k < slots; k++) {
    const carrying = int % place === place - 1;
    const digit = Math.floor(int / place) % 10;
    const pos = digit + (carrying ? roll : 0);
    let width = 0;
    if (k < shown) width = 1;
    else if (k === shown && carrying && digit === 0) width = roll;
    out.push({ pos, width, blur: clamp(Math.abs(speed) / place / 24) });
    place *= 10;
  }
  return out;
}

/** Forward-only hit envelope (punches, shakes): 0 when paused or rewinding. */
export function punch(tau: number, v: number, at: number, dur = 0.28): number {
  if (v <= 0) return 0;
  const u = (tau - at) / dur;
  if (u < 0 || u > 1) return 0;
  return u < 0.18 ? outCubic(u / 0.18) : (1 - (u - 0.18) / 0.82) ** 2;
}

/** Caret blink on wall time; solid while `typing`. */
export const caretOn = (w: number, typing: boolean, period = 1.06): boolean =>
  typing || ((w % period) + period) % period < period * 0.56;

export type CountSource = number | readonly Key[] | ((tau: number) => number);

export function resolveCount(source: CountSource): (tau: number) => number {
  if (typeof source === "number") return () => source;
  if (typeof source === "function") return source;
  return (tau) => sampleKeys(source, tau);
}

/** Visual speed of a τ-driven value per wall second, from a stateless finite difference. */
export function frameSpeed(fn: (tau: number) => number, tau: number, v: number): number {
  const h = 1 / 60;
  return ((fn(tau) - fn(tau - h)) / h) * (v === 0 ? 1 : Math.abs(v));
}

export type PileTile = { x: number; y: number; rotate: number; scale: number; visible: boolean };

const PILE_ROWS = [4, 3, 2, 1, 2] as const;

/** Resting slot of tile i relative to the pile's bottom-centre anchor. */
export function pileSlot(i: number, size: number): { x: number; y: number; rotate: number } {
  let row = 0;
  let start = 0;
  while (row < PILE_ROWS.length - 1 && i >= start + (PILE_ROWS[row] as number)) {
    start += PILE_ROWS[row] as number;
    row++;
  }
  const cap = PILE_ROWS[row] as number;
  const col = i - start;
  const gap = size * 1.08;
  return {
    x: (col - (cap - 1) / 2) * gap + (hash1(i * 7 + 1) - 0.5) * size * 0.16,
    y: -row * size * 0.9 - size / 2,
    rotate: (hash1(i * 13 + 5) - 0.5) * 18,
  };
}

/** Tiles for a fractional count: the newest tile hops in along an arc as the fraction grows. */
export function pileTiles(count: number, max: number, size: number): PileTile[] {
  const whole = Math.floor(count + EPS);
  const frac = count - whole;
  const out: PileTile[] = [];
  for (let i = 0; i < max; i++) {
    const slot = pileSlot(i, size);
    if (i < whole) {
      out.push({ ...slot, scale: 1, visible: true });
    } else if (i === whole && frac > EPS) {
      const u = outCubic(frac);
      const arc = Math.sin(Math.PI * Math.min(1, frac * 1.15)) * size * 2.6;
      out.push({
        x: slot.x + (1 - u) * size * 2.4,
        y: slot.y - arc - (1 - u) * size * 1.2,
        rotate: slot.rotate + (1 - u) * 160,
        scale: 0.6 + 0.4 * u,
        visible: true,
      });
    } else {
      out.push({ ...slot, scale: 0, visible: false });
    }
  }
  return out;
}

/** Keys that pocket tile `n` (count n−1 → n) over `dur` from `at`. */
export const pocketKeys = (at: number, n: number, dur = 0.5): readonly Key[] => [
  { at, value: n - 1 },
  { at: at + dur, value: n },
];

/** Smash-pan offset: 0 → `distance` px between `at` and `at + dur`. */
export const whipOffset = (tau: number, at: number, dur: number, distance: number): number =>
  distance * inOutExpo(prog(tau, at, at + dur));

/** Recap pan position in lines: dwells on each of `n` lines so every one can be read. */
export function recapPosition(tau: number, at: number, dur: number, n: number): number {
  if (n <= 1) return 0;
  const x = clamp((tau - at) / dur) * (n - 1);
  const i = Math.min(n - 2, Math.floor(x + EPS));
  return i + smootherstep(prog(x - i, 0.35, 1));
}

/** Smear for a pan, from its per-frame displacement (px at 60 fps). */
export function smear(offset: (tau: number) => number, tau: number, v: number) {
  const d = Math.abs(frameSpeed(offset, tau, v)) / 60;
  return { blur: Math.min(36, d * 0.35), stretch: 1 + Math.min(0.12, d / 1500) };
}

export const completionText = (pastVerb: string, duration: string, suffix?: string): string =>
  `${pastVerb} for ${duration}${suffix ? ` ${suffix}` : ""}`;
