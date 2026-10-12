import { settleTime, springProgress, type SpringCfg } from "#/engine/motion/spring";
import { sampleKeys, type Key } from "#/engine/motion/track";
import { hash2 } from "#/engine/util/random";

/** Launch times so the last of `n` staggered springs settles exactly at `settleBy`. */
export function staggerStarts(
  n: number,
  settleBy: number,
  stagger: number,
  spring: SpringCfg,
): number[] {
  const last = settleBy - settleTime(spring);
  return Array.from({ length: n }, (_, i) => last - (n - 1 - i) * stagger);
}

/** Unit spring progress launched at `start`, exactly at rest after its settle time. */
export function springFrom(tau: number, start: number, spring: SpringCfg): number {
  const dur = settleTime(spring);
  return springProgress(spring, dur, (tau - start) / dur);
}

export type Word = { id: string; text: string; line: number; index: number };

/** Splits display copy into words; `\n` forces a line break. */
export function splitWords(text: string): { lines: Word[][]; words: Word[] } {
  const words: Word[] = [];
  const lines = text.split("\n").map((line, li) =>
    line
      .split(" ")
      .filter(Boolean)
      .map((w) => {
        const word = { id: `w${words.length}`, text: w, line: li, index: words.length };
        words.push(word);
        return word;
      }),
  );
  return { lines, words };
}

export type FlapOpts = { start: number; stagger: number; flips: number; flipDur: number };

/** Which flip a cell is on and how far through it (0..1); step `flips` means landed. */
export function flapAt(tau: number, delay: number, o: FlapOpts): { step: number; phase: number } {
  const local = tau - o.start - delay;
  if (local <= 0) return { step: 0, phase: 0 };
  const total = o.flips * o.flipDur;
  if (local >= total) return { step: o.flips, phase: 0 };
  const step = Math.floor(local / o.flipDur);
  return { step, phase: (local - step * o.flipDur) / o.flipDur };
}

const SCRAMBLE = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789$×%";

/** Glyph shown at a flip step: `from` before, `to` once landed, seeded noise between. */
export function flapChar(from: string, to: string, step: number, flips: number, seed: number) {
  if (step <= 0) return from;
  if (step >= flips) return to;
  if (to === " " && from === " ") return " ";
  return SCRAMBLE[Math.floor(hash2(seed, step) * SCRAMBLE.length)] as string;
}

export type ZoneSize = number | readonly Key[];

/** Lays zones end to end; `capacity` (token units) fixes the scale, otherwise zones fill `width`. */
export function layoutZones(
  sizes: readonly ZoneSize[],
  tau: number,
  width: number,
  capacity?: number,
): { x: number; w: number }[] {
  const values = sizes.map((s) => Math.max(0, typeof s === "number" ? s : sampleKeys(s, tau)));
  const total = values.reduce((a, b) => a + b, 0);
  const unit = width / (capacity ?? (total || 1));
  let x = 0;
  return values.map((v) => {
    const out = { x, w: v * unit };
    x += out.w;
    return out;
  });
}
