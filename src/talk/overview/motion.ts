import { springAt, springVelocityAt, type SpringCfg } from "#/engine/motion/spring";

import { CELL_SCALE } from "./layout";

export type Spring = { x: number; v: number };
type Ring = { x: number; y: number; vx: number; vy: number };

const STAGGER_IN = 0.024;
const STAGGER_OUT = 0.008;
const REST = 1e-3;
const RING: SpringCfg = { zeta: 0.88, omega: 20 };

const OPEN_KEYS = new Set(["Escape", "m", "M", "o", "O"]);
const MOVE_KEYS = new Set([
  "ArrowRight",
  "ArrowLeft",
  "ArrowUp",
  "ArrowDown",
  "PageDown",
  "PageUp",
  " ",
  "Home",
  "End",
]);

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function step(s: Spring, target: number, cfg: SpringCfg, dt: number) {
  const x = springAt(dt, cfg, s.x, target, s.v);
  s.v = springVelocityAt(dt, cfg, s.x, target, s.v);
  s.x = x;
}

export const resting = (s: Spring, target: number) =>
  Math.abs(s.x - target) < REST && Math.abs(s.v) < REST;

type KeyLike = Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey">;

/** What a key does while the overview is open; `swallow` blocks it from the stage, null passes it. */
export function keyIntent(event: KeyLike): "close" | "jump" | "move" | "swallow" | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  if (OPEN_KEYS.has(event.key)) return "close";
  if (event.key === "Enter") return "jump";
  if (MOVE_KEYS.has(event.key)) return "move";
  return /^\d$/.test(event.key) ? "swallow" : null;
}

/**
 * Target scale of a cell `d` grid units from the anchor: opening staggers outward, closing staggers
 * inward from the farthest cell `far`.
 */
export function cellGoal(open: boolean, elapsed: number, d: number, far: number): 0 | 1 {
  if (open) return elapsed >= 0.05 + d * STAGGER_IN ? 1 : 0;
  return elapsed >= (far - d) * STAGGER_OUT ? 0 : 1;
}

/** Advances the selection ring toward `goal` on both axes. */
export function stepRing(ring: Ring, goal: { x: number; y: number }, dt: number): Ring {
  const rx = { x: ring.x, v: ring.vx };
  const ry = { x: ring.y, v: ring.vy };
  step(rx, goal.x, RING, dt);
  step(ry, goal.y, RING, dt);
  return { x: rx.x, y: ry.x, vx: rx.v, vy: ry.v };
}

/** Inline styles that shrink the live stage into its cell at zoom `p`; empty once fully closed. */
export function liveStyle(p: number, cell: { x: number; y: number }, closed: boolean) {
  if (closed) return { transform: "", borderRadius: "", boxShadow: "" };
  const scale = 1 + (CELL_SCALE - 1) * p;
  return {
    transform: `translate(${cell.x * p}px, ${cell.y * p}px) scale(${scale})`,
    borderRadius: `${(12 * clamp01(p)) / scale}px`,
    boxShadow: `0 ${18 / scale}px ${48 / scale}px rgb(0 0 0 / ${0.55 * clamp01(p)})`,
  };
}
