import { clamp, inOutCubic, lerp, outCubic, outExpo, prog } from "#/engine/motion/ease";
import { keys, type Key } from "#/engine/motion/track";
import { hash1 } from "#/engine/util/random";
import type { Cam, Shot } from "#/talk/kit/motion";

/** Story times for the cold open, title and spoiler (absolute τ). */
export const T = Object.freeze({
  typeAt: -0.02,
  submitAt: 0.4,
  pullOut: 0.42,
  spinnerAt: 0.7,
  rowsAt: 1.3,
  botHop: 2.0,
  shove: 3.0,
  diveStart: 4.0,
  diveEnd: 5.6,
  roadEnd: 6.6,
  walkStart: 6.0,
  walkEnd: 8.4,
  /** The "00" lands on the slam cue, then the odometer rolls it to 10 */
  slam: 9.15,
  titleRise: 9.03,
  odometerEnd: 9.9,
  bylineAt: 10.4,
  titleAt: 12,
  titleHoldEnd: 14,
  dollyEnd: 15.0,
  craneEnd: 15.8,
  boneStart: 15.6,
  boneEnd: 16.4,
  labelsAt: 17.1,
  spoilerTypeAt: 18.2,
  spoilerAt: 20,
  spoilerHoldEnd: 22,
  exitBone: 22.0,
  exitBoneEnd: 22.7,
  exitHop: 22.05,
  homeAt: 23.3,
  end: 23.4,
});

export const PROMPT = "fix the typo in README";
const MAIN_TOKENS = 97_300;
export const ROW_TOKENS = [171_900, 150_500, 217_600, 162_900, 231_200] as const;
export const TOTAL_TOKENS = MAIN_TOKENS + ROW_TOKENS.reduce((a, b) => a + b, 0);

/** Log-linear main-agent count: 1.2k the instant the spinner shows, 10k at 0.9, 97.3k at 1.38. */
const MAIN_KEYS: readonly (readonly [number, number])[] = [
  [T.spinnerAt, 1_200],
  [0.9, 10_000],
  [1.38, MAIN_TOKENS],
];

function mainTokensAt(tau: number): number {
  if (tau < T.spinnerAt) return 0;
  for (let i = 1; i < MAIN_KEYS.length; i++) {
    const a = MAIN_KEYS[i - 1] as readonly [number, number];
    const b = MAIN_KEYS[i] as readonly [number, number];
    if (tau < b[0]) {
      const u = (tau - a[0]) / (b[0] - a[0]);
      return 10 ** lerp(Math.log10(a[1]), Math.log10(b[1]), u);
    }
  }
  return MAIN_TOKENS;
}

/** Row i rolls up into place like a slot reel, then its counter spins to its real value. */
export const rowEnterAt = (i: number): number => T.rowsAt + 0.08 * i;
const rowRoll = (i: number) => ({ start: 1.4 + 0.04 * i, end: 2.0 + 0.04 * i });

export function rowTokenKeys(i: number): readonly Key[] {
  const { start, end } = rowRoll(i);
  return keys([start, 0], [end, ROW_TOKENS[i] ?? 0, outCubic]);
}

function rowTokensAt(i: number, tau: number): number {
  const { start, end } = rowRoll(i);
  return (ROW_TOKENS[i] ?? 0) * outCubic(prog(tau, start, end));
}

/** The spinner's `↓ n tokens`: main plus every subagent (1,031.4k at rest). */
export function totalTokensAt(tau: number): number {
  let sum = mainTokensAt(tau);
  for (let i = 0; i < ROW_TOKENS.length; i++) sum += rowTokensAt(i, tau);
  return sum;
}

/** τ at which the total first reaches each order of magnitude (10k, 100k, 1M). */
export function magnitudeCrossings(): number[] {
  return [1e4, 1e5, 1e6].map((target) => {
    let lo: number = T.spinnerAt;
    let hi = 3;
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (totalTokensAt(mid) >= target) hi = mid;
      else lo = mid;
    }
    return hi;
  });
}

/** Cold-open camera, in home-shot world px. The ❯ starts at hero size in the left third. */
const CHEVRON = { x: 210, y: 620 };
const CARET_END = 240.8 + PROMPT.length * 20.4;
const COLD_CAM_REST: Cam = { x: 600, y: 462, zoom: 2.3, roll: 0, tilt: 0 };

export const COLD_SHOTS: readonly Shot[] = [
  { at: 0, x: CHEVRON.x + (960 - 380) / 6, y: CHEVRON.y, zoom: 6, roll: -2 },
  { at: 0.37, x: CARET_END - (1460 - 960) / 6, y: CHEVRON.y, zoom: 6, roll: -2, path: "linear" },
  { at: 0.42, x: CARET_END - (1460 - 960) / 6, y: CHEVRON.y, zoom: 6, roll: -2 },
  // Tight on the spinner counter for 10k and 100k, then widen to reveal the subagents at 1M
  { at: 0.75, x: 520, y: 508, zoom: 2.8, roll: 0, ease: outExpo },
  { at: 1.35, x: 525, y: 500, zoom: 2.86, path: "linear" },
  { at: 2.05, x: 590, y: 432, zoom: 2.1, ease: inOutCubic },
  { at: 3.0, ...COLD_CAM_REST, ease: inOutCubic },
];

/** The spinner's token count in world px (the camera punches toward it). */
export const COUNTER_AT = { x: 640, y: 516 };

/** Forward-only camera punch (+7%) at each order of magnitude. */
export function coldPunch(tau: number, v: number, crossings: readonly number[]): number {
  if (v <= 0) return 1;
  let k = 0;
  for (const at of crossings) {
    const u = (tau - at) / 0.32;
    if (u >= 0 && u <= 1) k = Math.max(k, u < 0.2 ? outCubic(u / 0.2) : (1 - (u - 0.2) / 0.8) ** 2);
  }
  return 1 + 0.07 * k;
}

/** Spinner ✳ box in world px (where the dive starts). */
const SPIN_BOX = { x: 200, y: 500, size: 36 };

/** Where the ✳ sits on screen under the resting cold-open camera. */
export function spinOnScreen(cam: Cam = COLD_CAM_REST) {
  return {
    x: 960 + (SPIN_BOX.x - cam.x) * cam.zoom,
    y: 540 + (SPIN_BOX.y - cam.y) * cam.zoom,
    size: SPIN_BOX.size * cam.zoom,
  };
}

/** Projected height of a plane of `height` px pitched back `pitch`° under `perspective(d)`. */
function roadFar(height: number, pitch: number, d = 900): number {
  const r = (pitch * Math.PI) / 180;
  return (height * Math.cos(r) * d) / (d + height * Math.sin(r));
}

export const ROAD = Object.freeze({
  height: 6000,
  pitch: 72,
  scale: 2,
  /** Bar bottom-centre in home px, and where the road framing moves it */
  origin: { x: 800, y: 740 },
  at: { x: 1530, y: 1180 },
});

export const HORIZON_Y = ROAD.at.y - ROAD.scale * roadFar(ROAD.height, ROAD.pitch);
export const SUN = Object.freeze({ x: ROAD.at.x, y: HORIZON_Y - 30, r: 74 });

/** Road framing at τ (0 = home bar, 1 = road) for the cold-open rise and the spoiler crane. */
export function roadFraming(tau: number): number {
  if (tau < T.titleHoldEnd) return inOutCubic(prog(tau, T.diveEnd, T.roadEnd));
  return 1 - inOutCubic(prog(tau, T.dollyEnd, T.craneEnd));
}

/** Lane scroll in plane px: cruise, slow creep in the hold, then the ×3 dolly. */
export function laneScroll(tau: number): number {
  const cruise = 420;
  const a = Math.min(tau, T.titleAt) - T.diveEnd;
  let s = Math.max(0, a) * cruise;
  if (tau > T.titleAt) s += (Math.min(tau, T.titleHoldEnd) - T.titleAt) * 30;
  if (tau > T.titleHoldEnd) {
    const u = prog(tau, T.titleHoldEnd, T.dollyEnd);
    s += 3200 * u * u;
  }
  return s;
}

/** Token blocks falling from the sun onto the road's left shoulder: a pure f(i, τ). */
const BLOCK_EVERY = 0.6;
const BLOCK_FALL = 1.8;
const BLOCK_FIRST = 6.2;
export const BLOCK_COUNT = 12;

const COLUMNS = [
  { x: 760, y: 880, size: 60 },
  { x: 920, y: 824, size: 50 },
  { x: 1055, y: 778, size: 42 },
  { x: 1170, y: 742, size: 34 },
] as const;

export function blockSlot(i: number) {
  const col = COLUMNS[i % COLUMNS.length] as (typeof COLUMNS)[number];
  const level = Math.floor(i / COLUMNS.length);
  const jitter = (hash1(i * 31 + 7) - 0.5) * col.size * 0.18;
  return {
    x: col.x + jitter,
    y: col.y - col.size * (level + 0.5),
    size: col.size,
    rotate: (hash1(i * 17 + 3) - 0.5) * 10,
  };
}

export type BlockState = { x: number; y: number; size: number; rotate: number; visible: boolean };

export function blockAt(i: number, tau: number): BlockState {
  const spawn = BLOCK_FIRST + i * BLOCK_EVERY;
  const slot = blockSlot(i);
  if (tau < spawn) return { ...slot, visible: false };
  const u = clamp((tau - spawn) / BLOCK_FALL);
  if (u >= 1) return { ...slot, visible: true };
  const x = lerp(SUN.x, slot.x, u);
  const y = lerp(SUN.y, slot.y, u * u) - 60 * Math.sin(Math.PI * u);
  return {
    x,
    y,
    size: lerp(16, slot.size, u),
    rotate: slot.rotate + (1 - u) * (hash1(i) > 0.5 ? 1 : -1) * 260,
    visible: true,
  };
}

/** Blocks in flight at τ (for the frozen-moment check). */
export function blocksInFlight(tau: number): number {
  let n = 0;
  for (let i = 0; i < BLOCK_COUNT; i++) {
    const spawn = BLOCK_FIRST + i * BLOCK_EVERY;
    if (tau >= spawn && tau < spawn + BLOCK_FALL) n++;
  }
  return n;
}

/** Sun ray rotation (deg): cruising, then 2°/τ-s in the hold. */
export function rayRotation(tau: number): number {
  const lead = Math.max(0, Math.min(tau, T.titleAt) - T.diveEnd) * 14;
  const hold = Math.max(0, tau - T.titleAt) * 2;
  return lead + hold;
}

/** Hold push 1.00 → 1.03 over the title hold. */
export const holdPush = (tau: number): number => 1 + 0.03 * prog(tau, T.titleAt, T.titleHoldEnd);

/** Spoiler zone sizes: home ratios on the road, labeled ratios on the bone bar, home again on exit. */
export const SPOILER_SIZES = {
  system: keys([16, 18], [16.9, 16, inOutCubic], [22.1, 16], [22.7, 18, inOutCubic]),
  tools: keys([16, 22], [16.9, 20, inOutCubic], [22.1, 20], [22.7, 22, inOutCubic]),
  claude: keys([16, 10], [16.9, 16, inOutCubic], [22.1, 16], [22.7, 10, inOutCubic]),
  messages: keys([16, 30], [16.9, 28, inOutCubic], [22.1, 28], [22.7, 30, inOutCubic]),
  results: keys([16, 0], [16.9, 20, inOutCubic], [22.1, 20], [22.7, 0, inOutCubic]),
};
