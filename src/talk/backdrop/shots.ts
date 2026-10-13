import { clamp, inOutCubic, smoothstep } from "#/engine/motion/ease";

/**
 * Pdoom-style shots: each is a camera rig around a focus point plus the distortions it shows. Every
 * field blends linearly, so a morph between shots reads as a crane.
 */
export type Rig = {
  /** Horizontal camera distance from the focus */
  dist: number;
  /** Camera height above the focus */
  height: number;
  /** Camera azimuth around the focus (0 = behind it, looking down -z) and its slow sway */
  orbit: number;
  orbitAmp: number;
  /** How far ahead of the travel base the focus sits */
  ahead: number;
  roll: number;
  rollAmp: number;
  /** Distortion centre offset from the focus, in world units (x, z) */
  cx: number;
  cz: number;
  /** Multiplier on the mood's terrain warp */
  warp: number;
  /** Gravity-well depth, 0..1 */
  well: number;
  /** Concentric ripple amplitude, 0..1 */
  ripple: number;
  /** Vortex twist of the grid lines, 0..1 */
  swirl: number;
  /** Polar (tikz) grid and clay construction lines, 0..1 */
  polar: number;
  /** Glowing ring at the well's throat, 0..1 */
  ring: number;
  /** Clay glow pooled at the centre, 0..1 */
  glow: number;
  /** Multipliers on the mood's grid lines, contours and ceiling */
  grid: number;
  contour: number;
  ceiling: number;
  /** Chromatic aberration in px at the frame edge */
  ca: number;
};

const GLIDE: Rig = {
  dist: 14,
  height: 2.8,
  orbit: 0,
  orbitAmp: 0.06,
  ahead: 14,
  roll: 0,
  rollAmp: 0.03,
  cx: 0,
  cz: 0,
  warp: 1,
  well: 0,
  ripple: 0,
  swirl: 0,
  polar: 0,
  ring: 0,
  glow: 0,
  grid: 1,
  contour: 1,
  ceiling: 1,
  ca: 1.4,
};

export const SHOTS = {
  /** Low forward dolly over the warping floor */
  glide: GLIDE,
  /** Flat top-down tikz plot: polar grid with clay axes, slowly turning */
  plot: {
    ...GLIDE,
    dist: 1.6,
    height: 17,
    orbit: 0.4,
    orbitAmp: 0.35,
    ahead: 22,
    rollAmp: 0,
    cx: 2.5,
    cz: -1.5,
    warp: 0.12,
    polar: 1,
    grid: 1.1,
    contour: 0,
    ceiling: 0,
    ca: 1.2,
  },
  /** High oblique contour terrain with a funnel off to the side */
  terrain: {
    ...GLIDE,
    dist: 15,
    height: 9,
    orbit: 0.55,
    orbitAmp: 0.12,
    ahead: 16,
    roll: -0.1,
    rollAmp: 0.04,
    cx: 6,
    cz: -6,
    warp: 1.7,
    well: 0.7,
    grid: 0.35,
    contour: 2.2,
    ceiling: 0,
    ca: 1.6,
  },
  /** Head-on concentric ripples around a clay glow */
  ripple: {
    ...GLIDE,
    dist: 3.5,
    height: 14,
    orbit: -0.3,
    orbitAmp: 0.25,
    ahead: 20,
    rollAmp: 0.05,
    cz: -4,
    warp: 0.25,
    ripple: 1,
    glow: 1,
    grid: 0.3,
    contour: 2.4,
    ceiling: 0,
    ca: 1.5,
  },
  /** A grid bending into a gravity well with a glowing ring */
  well: {
    ...GLIDE,
    dist: 10,
    height: 9.5,
    orbit: -0.35,
    orbitAmp: 0.15,
    ahead: 14,
    roll: 0.05,
    rollAmp: 0.04,
    cx: 8,
    cz: -9,
    warp: 0.4,
    well: 1,
    ring: 1,
    grid: 1.05,
    contour: 0.4,
    ceiling: 0,
    ca: 1.8,
  },
  /** The well twisted into a swirling vortex */
  vortex: {
    ...GLIDE,
    dist: 9,
    height: 10,
    orbit: 0.3,
    orbitAmp: 0.2,
    ahead: 13,
    roll: -0.06,
    rollAmp: 0.08,
    cx: 7,
    cz: -11,
    warp: 0.5,
    well: 0.8,
    swirl: 1,
    ring: 0.6,
    grid: 1.1,
    contour: 0.6,
    ceiling: 0,
    ca: 1.8,
  },
  /** Skimming the floor at a tilt, aberration up */
  low: {
    ...GLIDE,
    dist: 8,
    height: 0.9,
    orbit: 0.15,
    orbitAmp: 0.1,
    ahead: 8,
    roll: 0.07,
    rollAmp: 0.05,
    warp: 1.3,
    contour: 1.3,
    ceiling: 0.6,
    ca: 2.4,
  },
} as const satisfies Record<string, Rig>;

export type ShotName = keyof typeof SHOTS;

/** Shot per stop; screenshot, demo and dense stops get the quiet glide. */
export const STOP_SHOTS: Readonly<Record<string, ShotName>> = {
  title: "glide",
  spoiler: "glide",
  "fw-chatbox": "ripple",
  "fw-taste": "terrain",
  "fw-invest": "well",
  "t1-agents": "glide",
  "t1-model-effort": "terrain",
  "t1-advisor": "vortex",
  "t2-stateless": "plot",
  "t2-kv": "plot",
  "t2-price": "glide",
  "t2-ttl": "ripple",
  "t2-agent-ttl": "ripple",
  "t2-idle": "terrain",
  "t2-switch": "vortex",
  "t3-then": "low",
  "t3-aa": "plot",
  "t4-superpowers": "well",
  "t5-routines": "glide",
  "t5-chain": "terrain",
  "t6-kiro": "low",
  "t6-others": "low",
  "t7-rtk": "plot",
  "t7-headroom": "glide",
  "t8-cache": "well",
  "t8-18x": "vortex",
  "t9-suggestions": "terrain",
  "t10-resets": "glide",
  "t10-offers": "ripple",
  "b-system-one": "low",
  "b-laya": "glide",
  "b-browser": "plot",
  "aft-limits": "glide",
  "aft-wanted": "well",
  "outro-thesis": "vortex",
  "outro-qr": "ripple",
};

export type ShotStop = { id: string; at: number; holdSpan: number };

/** Story seconds a morph between neighbouring stops' shots takes, centred in the transit. */
const MORPH = 3.6;

const RIG_KEYS = Object.keys(GLIDE) as (keyof Rig)[];

const shotOf = (stop: ShotStop | undefined): Rig => SHOTS[STOP_SHOTS[stop?.id ?? ""] ?? "glide"];

function mix(a: Rig, b: Rig, t: number): Rig {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const out = { ...a };
  for (const k of RIG_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

/** The rig at τ: each stop's shot through its hold, craning to the next shot mid-transit. */
export function rigAt(tau: number, stops: readonly ShotStop[]): Rig {
  const next = stops.findIndex((s) => tau < s.at);
  if (next === -1) return shotOf(stops.at(-1));
  if (next === 0) return shotOf(stops[0]);
  const a = stops[next - 1]!;
  const b = stops[next]!;
  const from = a.at + a.holdSpan;
  const to = b.at - 0.6;
  const span = Math.min(MORPH, Math.max(to - from, 1.5));
  const mid = (from + to) / 2;
  return mix(shotOf(a), shotOf(b), inOutCubic(clamp((tau - (mid - span / 2)) / span)));
}

/** Backdrop presence: hidden through the title's own fly-through, in as its crane settles. */
export function presenceAt(tau: number): number {
  return smoothstep(clamp((tau - 15.1) / 1.8));
}
