import { outCubic, prog } from "#/engine/motion/ease";

export const TIP8 = {
  window: { start: 209.4, end: 222.9 },
  typeAt: 209.5,
  cps: 48,
  submitAt: 210.2,
  spinnerAt: 210.4,
  dive: { start: 211.0, end: 212.2 },
  rows: [211.4, 211.9, 212.4],
  cache: { at: 214, hold: 2.5 },
  board: { foldStart: 216.55, foldEnd: 217.1 },
  towers: { start: 216.7, cursorEnd: 217.3, ccSettle: 218.7 },
  headline: 218.5,
  stamp: 218.7,
  foot: { start: 217.9, cps: 90 },
  x18: { at: 219.5, hold: 2 },
  exit: 221.5,
} as const;

/** Height of one tower block; the label base under each tower is `BASE` tall. */
export const BLOCK = 36;
export const BASE = 44;

/** Height of the Cursor tower: one block, done early. */
export function cursorTower(tau: number): number {
  return BLOCK * outCubic(prog(tau, TIP8.towers.start, TIP8.towers.cursorEnd));
}

/** Height of the CC tower: 18× the Cursor tower, then it keeps climbing ≤ 30 px/τ-s. */
export function ccTower(tau: number, creep = 30): number {
  const { start, ccSettle } = TIP8.towers;
  const burst = 18 * BLOCK * outCubic(prog(tau, start + 0.1, ccSettle));
  return burst + Math.max(0, tau - ccSettle) * creep;
}

/**
 * Pairs a two-column table row into flap lines of ≤ `max` chars per column, both columns padded to
 * the same line count so the boards stay aligned.
 */
export function flapRows(left: string, right: string, max: number): [string[], string[]] {
  const wrap = (text: string) => {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (line && Array.from(next).length > max) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  const a = wrap(left);
  const b = wrap(right);
  const n = Math.max(a.length, b.length);
  while (a.length < n) a.push("");
  while (b.length < n) b.push("");
  return [a, b];
}

/** Decorative ↓ counter on the board: rolls up fast, then ticks ≤ 1 flap per τ-s. */
export function flapCounter(tau: number): number {
  const { rows, cache } = TIP8;
  const start = rows[0];
  const settle = cache.at - 0.8;
  return 140_000 * outCubic(prog(tau, start, settle)) + Math.max(0, tau - settle) * 0.62;
}
