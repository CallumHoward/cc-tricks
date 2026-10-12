import { clamp, inOutCubic, outCubic, prog } from "#/engine/motion/ease";

/** Exit beats after a tip's last hold: fold → completion line → pocket → whip (1.4 τ-s in all). */
export function exitTimes(at: number) {
  return {
    foldEnd: at + 0.3,
    completeAt: at + 0.15,
    pocketAt: at + 0.3,
    pocketDur: 0.5,
    whipAt: at + 0.8,
    whipDur: 0.5,
  };
}

/**
 * Greedy wrap of a shell command at `max` chars that never separates a flag from its value;
 * continuation lines are indented two spaces.
 */
export function wrapCommand(command: string, max: number): string[] {
  const words = command.split(" ");
  const groups: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i] as string;
    const next = words[i + 1];
    if (word.startsWith("-") && next !== undefined && !next.startsWith("-")) {
      groups.push(`${word} ${next}`);
      i++;
    } else groups.push(word);
  }
  const lines: string[] = [];
  let line = "";
  for (const group of groups) {
    const candidate = line ? `${line} ${group}` : group;
    if (line && Array.from(candidate).length > max) {
      lines.push(line);
      line = `  ${group}`;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

/** Kiro documents `--v3` after the subcommand (`kiro-cli chat --v3 …`). */
export function documentedKiro(command: string): string {
  return command.replace(/^kiro-cli --v3 chat\b/, "kiro-cli chat --v3");
}

/** Chars typed by τ at `cps` from `start`, quantised to 60 Hz like the kit's typing. */
export function typedAt(tau: number, start: number, cps: number, length: number): number {
  if (tau < start) return 0;
  const q = Math.ceil(tau * 60 - 1e-6) / 60;
  return clamp(Math.floor((q - start) * cps + 1e-6), 0, length);
}

export type Point = { x: number; y: number };

/** A quadratic arc from `a` to `b` bulging `lift` px upward at its middle. */
export function arcPoint(a: Point, b: Point, lift: number, u: number): Point {
  const cx = (a.x + b.x) / 2;
  const cy = Math.min(a.y, b.y) - lift;
  const v = 1 - u;
  return {
    x: v * v * a.x + 2 * v * u * cx + u * u * b.x,
    y: v * v * a.y + 2 * v * u * cy + u * u * b.y,
  };
}

/**
 * Baton progress along its arc: a fast throw to `mid` by `settle`, then a slow creep (`creep` of
 * the arc per τ-s) so the hold still breathes.
 */
export function batonProgress(
  tau: number,
  launch: number,
  settle: number,
  mid: number,
  creep: number,
): number {
  if (tau <= launch) return 0;
  if (tau < settle) return mid * outCubic(prog(tau, launch, settle));
  return Math.min(1, mid + (tau - settle) * creep);
}

export const TIP6 = {
  window: { start: 177.9, end: 191.9 },
  typeAt: 177.95,
  cps: 70,
  submitAt: 179.0,
  spinnerAt: 179.2,
  /** Camera lifts the transcript; the prompt box rule becomes the pane split */
  lift: { start: 179.3, end: 179.9, dy: -160 },
  split: { start: 179.6, end: 179.95 },
  kiroType: { start: 179.9, cps: 110 },
  labelsType: { start: 181.1, cps: 140 },
  baton: { launch: 180.15, land: 181.15 },
  kiro: { at: 182.5, hold: 2.5 },
  others: { at: 188, hold: 2.5, start: 185 },
  collapse: { start: 185.0, end: 185.45 },
  rows: [185.1, 185.3, 185.5],
  rowType: [185.3, 185.7, 186.1],
  l1: 187.2,
  exit: 190.5,
} as const;

/** Vertical offset of the prompt stack during the plate (returns home inside the exit fold). */
export function tip6StackDy(tau: number): number {
  const { lift, exit } = TIP6;
  const up = prog(tau, lift.start, lift.end, inOutCubic);
  const down = prog(tau, exit, exit + 0.3, inOutCubic);
  return lift.dy * up * (1 - down);
}

export type PlaceKey = { at: number; x: number; y: number; scale: number };

/** The bot's offset from BOT_HOME at τ: eased moves between keyed places, held outside them. */
export function placeAt(track: readonly PlaceKey[], tau: number): Omit<PlaceKey, "at"> {
  const first = track[0];
  if (!first) return { x: 0, y: 0, scale: 1 };
  let prev = first;
  for (const key of track) {
    if (tau < key.at) {
      const u = inOutCubic(prog(tau, prev.at, key.at));
      return {
        x: prev.x + (key.x - prev.x) * u,
        y: prev.y + (key.y - prev.y) * u,
        scale: prev.scale + (key.scale - prev.scale) * u,
      };
    }
    prev = key;
  }
  return { x: prev.x, y: prev.y, scale: prev.scale };
}
