import { clamp, inOutExpo, inQuad, outCubic, outExpo, prog } from "#/engine/motion/ease";
import type { StyleValues } from "#/engine/stage/applier";
import { BOT_HOME } from "#/talk/segments/shared/home";

/** Visible window of this segment (registry: start + tail → next start + tail). */
export const WIN = Object.freeze({ start: 151.9, end: 160.9 });
export const AT = 156.5;
export const HOLD_END = 159.5;
/** Impact lands on the next press, just past the hold. */
export const CRACK = HOLD_END + 0.15;

export const TURN = Object.freeze({
  prompt: "4. Only use superpowers when needed",
  typeAt: 152,
  cps: 50,
  submitAt: 152.85,
  spinnerAt: 153,
});

/** The split walnut gets 0.45 τ-s on screen before the plate folds. */
export const EXIT = Object.freeze({
  fold: CRACK + 0.45,
  foldEnd: CRACK + 0.73,
  dockUp: CRACK + 0.5,
  completeAt: CRACK + 0.55,
  pocketAt: CRACK + 0.8,
  whipAt: CRACK + 0.87,
  whipEnd: 160.84,
  home: 160.84,
});

export const DOCK_DROP = 640;

export function dockY(tau: number): number {
  const down = prog(tau, 152.95, 153.45, inOutExpo);
  const up = prog(tau, EXIT.dockUp, EXIT.dockUp + 0.45, outExpo);
  return DOCK_DROP * (down - up);
}

// Plan → triads → hammer -----------------------------------------------------------------------

export const PLAN = Object.freeze({ cols: [200, 700] as const, top: 548, gap: 50, enter: 153.1 });

export type PlanRow = { i: number; label: string; x: number; y: number; at: number };

/** Ten plan rows in two columns of five; `y` is the row's centre line. */
export const PLAN_ROWS: readonly PlanRow[] = Array.from({ length: 10 }, (_, i) => ({
  i,
  label: `[ ] Task ${i + 1}`,
  x: PLAN.cols[i < 5 ? 0 : 1] ?? 200,
  y: PLAN.top + 18 + (i % 5) * PLAN.gap,
  at: PLAN.enter + i * 0.05,
}));

/** The odometer's "+" pops once the count lands. */
export const PLUS_AT = 154.3;

export const SPROUT = Object.freeze({ start: 153.6, stagger: 0.05, dur: 0.3 });

/** The three ✳ of row i (implementer, reviewer, reviewer), at rest beside the row. */
export function triadHome(row: number, j: number): { x: number; y: number } {
  const r = PLAN_ROWS[row] as PlanRow;
  return { x: r.x + 290 + j * 44, y: r.y };
}

/** Hammer geometry at rest (frozen frame): head bottom sits `gap` px above the walnut. */
export const HAMMER = Object.freeze({
  cx: 1600,
  headW: 260,
  headH: 130,
  handleH: 300,
  handleW: 26,
});
export const WALNUT = Object.freeze({ cx: 1600, w: 136, h: 100, ground: 800 });
export const WALNUT_TOP = WALNUT.ground - WALNUT.h;
/** Head top when hoisted, before the release: above and right of the headline. */
export const HOIST_TOP = 90;
const HOISTED_GAP = WALNUT_TOP - (HOIST_TOP + HAMMER.headH);

export const CONVERGE = Object.freeze({ start: 154.7, end: 155.2 });
export const RELEASE = 155.5;

/** Bullet time: the fall accelerates until `FALL.join`, then brakes hard into `gap` at `at`. */
export const FALL = Object.freeze({ join: AT - 0.3, joinGap: 30, gap: 6, creep: 0.5 });

/**
 * Gap (px) between the head and the walnut: hoisted → falls (accelerating) → brakes into 6 px at
 * `at` → creeps 0.5 px/τ-s → 0 at CRACK.
 */
export function hammerGap(tau: number): number {
  if (tau < RELEASE) {
    const windUp = Math.sin(prog(tau, 155.15, RELEASE) * Math.PI) * 18;
    return HOISTED_GAP + windUp;
  }
  if (tau < FALL.join) {
    return HOISTED_GAP - (HOISTED_GAP - FALL.joinGap) * prog(tau, RELEASE, FALL.join) ** 3;
  }
  if (tau < AT)
    return FALL.joinGap - (FALL.joinGap - FALL.gap) * outCubic(prog(tau, FALL.join, AT));
  if (tau < HOLD_END) return FALL.gap - FALL.creep * (tau - AT);
  const atHoldEnd = FALL.gap - FALL.creep * (HOLD_END - AT);
  if (tau < CRACK) return atHoldEnd * (1 - inQuad(prog(tau, HOLD_END, CRACK)));
  return -22 * outExpo(prog(tau, CRACK, CRACK + 0.06));
}

/** Fall progress 0 (hoisted) → 1 (at rest above the walnut), from the gap. */
const fallDone = (tau: number) => clamp((HOISTED_GAP - hammerGap(tau)) / (HOISTED_GAP - FALL.gap));

/** Swing (deg, clockwise about the head's centre): cocked 28° → 10° at `at` → 1.5°/τ-s → flat. */
export function hammerTilt(tau: number): number {
  if (tau < AT) return 28 - 18 * fallDone(tau);
  if (tau < HOLD_END) return 10 - 1.5 * (tau - AT);
  const atHoldEnd = 10 - 1.5 * (HOLD_END - AT);
  return atHoldEnd * (1 - inQuad(prog(tau, HOLD_END, CRACK)));
}

/** Ground shadow under the head: 0 while hoisted, 1 on impact. */
export const hammerShadow = (tau: number): number =>
  tau >= CRACK ? 1 : clamp(1 - hammerGap(tau) / HOISTED_GAP);

/** Head top y at τ. */
export const headTop = (tau: number): number => WALNUT_TOP - hammerGap(tau) - HAMMER.headH;

/** The head forms from the swarm: 0 → 1 while the ✳ converge. */
export const headForm = (tau: number): number => prog(tau, 155.0, 155.3, outCubic);

/** Motion streak length above the head: grows through the fall and hangs in bullet time. */
export function streakLength(tau: number): number {
  if (tau < RELEASE || tau >= CRACK + 0.1) return 0;
  return 150 * outCubic(prog(tau, RELEASE + 0.1, AT - 0.2)) * (1 - prog(tau, CRACK, CRACK + 0.1));
}

/** Where ✳ k (row-major: row = k/3, j = k%3) is: sprouting, at rest, or converging into the head. */
export function swarmAt(k: number, tau: number): { x: number; y: number; scale: number } {
  const row = Math.floor(k / 3);
  const j = k % 3;
  const home = triadHome(row, j);
  const sprout = SPROUT.start + row * SPROUT.stagger;
  const pop = prog(tau, sprout, sprout + SPROUT.dur, outExpo);
  const start = CONVERGE.start + (k % 10) * 0.012;
  const u = prog(tau, start, CONVERGE.end, inOutExpo);
  const col = k % 10;
  const line = Math.floor(k / 10);
  const target = {
    x: HAMMER.cx - 112 + col * 25,
    y: headTop(tau) + 30 + line * 35,
  };
  const scale = pop * (1 - 0.5 * u) * (1 - headForm(tau));
  return {
    x: home.x + (target.x - home.x) * u,
    y: home.y + (target.y - home.y) * u - Math.sin(u * Math.PI) * 120,
    scale,
  };
}

/** Dispatches odometer: one per sprouted ✳. */
export function dispatches(tau: number): number {
  return 30 * prog(tau, SPROUT.start, SPROUT.start + 9 * SPROUT.stagger + SPROUT.dur);
}

/** The odometer pops in once the dock has dropped clear of it. */
export const odometerScale = (tau: number): number =>
  tau < 153.45 ? 0 : 0.6 + 0.4 * prog(tau, 153.45, 153.75, outExpo);

/** The plan (spinner, rows, odometer) folds shut once the swarm has left. */
export function planFold(tau: number): StyleValues {
  const u = prog(tau, 154.8, 155.1, inOutExpo);
  return { scaleY: 1 - u, opacity: u >= 1 ? 0 : 1 };
}

// Walnut ---------------------------------------------------------------------------------------

/** Each half of the walnut splays open on impact (sign −1 left, +1 right). */
export function walnutHalf(side: -1 | 1, tau: number): StyleValues {
  const u = outExpo(prog(tau, CRACK, CRACK + 0.32));
  return { x: side * 64 * u, y: 6 * u, rotate: side * 38 * u };
}

export const SHARDS = [
  { dx: -140, dy: -90, r: -200 },
  { dx: -70, dy: -150, r: 140 },
  { dx: 20, dy: -170, r: -90 },
  { dx: 110, dy: -120, r: 220 },
  { dx: 160, dy: -60, r: -160 },
  { dx: -170, dy: -30, r: 90 },
] as const;

/** Shell shards fly out on a ballistic arc from the impact point. */
export function shardAt(i: number, tau: number): StyleValues {
  const s = SHARDS[i] ?? SHARDS[0];
  const t = tau - CRACK;
  if (t <= 0) return { scale: 0 };
  const u = clamp(t / 0.5);
  return {
    x: s.dx * outCubic(u),
    y: s.dy * outCubic(u) + 420 * u * u,
    rotate: s.r * u,
    scale: 1 - u * 0.4,
  };
}

// Bot ------------------------------------------------------------------------------------------

export const BOT_SPOT = Object.freeze({
  x: 1680 - BOT_HOME.left,
  y: WALNUT.ground - 180 - BOT_HOME.top,
});
export const BOT_HOPS = Object.freeze({
  out: { at: 154.3, air: 0.4 },
  home: { at: CRACK + 0.12, air: 0.28 },
});

export function botOffset(tau: number): { x: number; y: number } {
  const fly = (h: { at: number; air: number }) => prog(tau, h.at + 0.16, h.at + 0.16 + h.air);
  const a = fly(BOT_HOPS.out);
  const b = fly(BOT_HOPS.home);
  const arc = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    u: number,
    h: number,
  ) => ({
    x: from.x + (to.x - from.x) * u,
    y: from.y + (to.y - from.y) * u - Math.sin(u * Math.PI) * h,
  });
  if (b > 0) return arc(BOT_SPOT, { x: 0, y: 0 }, b, 160);
  return arc({ x: 0, y: 0 }, BOT_SPOT, a, 120);
}

// Exit -----------------------------------------------------------------------------------------

/** Hammer, walnut and label squash onto the ground line before the dock rises through them. */
export function propFold(tau: number): StyleValues {
  const u = prog(tau, CRACK + 0.3, EXIT.dockUp, inOutExpo);
  return { y: 40 * u, scaleY: 1 - u, opacity: u >= 1 ? 0 : 1 };
}

export function plateFold(tau: number): StyleValues {
  const u = prog(tau, EXIT.fold, EXIT.foldEnd, inOutExpo);
  return { scaleY: 1 - u, opacity: u >= 1 ? 0 : 1 };
}

export function whipUp(tau: number): StyleValues {
  const u = prog(tau, EXIT.whipAt, EXIT.whipEnd, inOutExpo);
  const mid = Math.sin(u * Math.PI);
  return { y: -620 * u, scaleY: 1 + 1.4 * mid, blur: 6 * mid, opacity: u >= 1 ? 0 : 1 };
}
