import { clamp, lerp, smoothstep } from "#/engine/motion/ease";
import type { MountWindow } from "#/engine/types";

/**
 * The backdrop world as pure functions. Travel, warp and parallax take ambient time ρ (it creeps at
 * stops and rushes in transit); moods take story time τ (which segment we're in).
 */

/** World units the camera travels per ρ-second. */
export const TRAVEL = 4;
/** Grid cell edge in world units. */
export const CELL = 1;
/** Ceiling height of the tunnel when it shows. */
export const CEILING = 7.5;

export type Pose = {
  x: number;
  y: number;
  z: number;
  pitch: number;
  yaw: number;
  roll: number;
};

/**
 * Crane/track pose: a steady dolly forward with slow interleaved arcs, so travel never reads
 * linear.
 */
export function cameraAt(rho: number): Pose {
  return {
    x: 1.25 * Math.sin(rho * 0.11) + 0.45 * Math.sin(rho * 0.047 + 1),
    y: 2.8 + 0.85 * Math.sin(rho * 0.083 + 0.5),
    z: -TRAVEL * rho,
    pitch: -0.2 + 0.05 * Math.sin(rho * 0.083 + 2.1) + 0.025 * Math.sin(rho * 0.031),
    yaw: 0.07 * Math.sin(rho * 0.039 + 0.4),
    roll: 0.03 * Math.sin(rho * 0.07 + 2),
  };
}

/** Camera velocity per ρ-second (finite difference of the pose, so it can't drift from it). */
export function cameraVelocity(rho: number): [number, number, number] {
  const h = 1e-3;
  const a = cameraAt(rho - h);
  const b = cameraAt(rho + h);
  return [(b.x - a.x) / (2 * h), (b.y - a.y) / (2 * h), (b.z - a.z) / (2 * h)];
}

/** Floor warp height; mirrored in GLSL (`HEIGHT_GLSL`) so lights can sit on the surface. */
export function heightAt(x: number, z: number, rho: number, warp: number): number {
  const h =
    0.55 * Math.sin(x * 0.23 + rho * 0.31) +
    0.75 * Math.sin(z * 0.17 - rho * 0.23 + x * 0.07) +
    0.5 * Math.sin((x + z) * 0.11 + rho * 0.17) +
    0.25 * Math.sin(x * 0.53 - z * 0.37 + rho * 0.45);
  return h * warp;
}

export const HEIGHT_GLSL = /* glsl */ `
float heightAt(vec2 p, float rho, float warp) {
  float h = 0.55 * sin(p.x * 0.23 + rho * 0.31)
    + 0.75 * sin(p.y * 0.17 - rho * 0.23 + p.x * 0.07)
    + 0.5 * sin((p.x + p.y) * 0.11 + rho * 0.17)
    + 0.25 * sin(p.x * 0.53 - p.y * 0.37 + rho * 0.45);
  return h * warp;
}`;

export type Mood = {
  /** Grid line brightness */
  grid: number;
  /** Surface warp amplitude */
  warp: number;
  /** Topographic contour lines of the warp, 0..1 */
  contour: number;
  /** Mirrored ceiling grid (tunnel), 0..1 */
  ceiling: number;
  /** Point light intensity */
  lights: number;
  /** Share of lights in clay rather than cool white */
  warm: number;
  /** How much the frame center is dimmed for readable slides */
  calm: number;
  /** Dust and bokeh brightness */
  dust: number;
};

const RICH: Mood = {
  grid: 1,
  warp: 1.1,
  contour: 0.7,
  ceiling: 0.6,
  lights: 1,
  warm: 0.7,
  calm: 0.45,
  dust: 1,
};
const TIP: Mood = {
  grid: 0.7,
  warp: 0.7,
  contour: 0.25,
  ceiling: 0.25,
  lights: 0.7,
  warm: 0.45,
  calm: 0.7,
  dust: 0.75,
};
const QUIET: Mood = {
  grid: 0.5,
  warp: 0.45,
  contour: 0.1,
  ceiling: 0,
  lights: 0.5,
  warm: 0.3,
  calm: 0.82,
  dust: 0.6,
};

/** Per-segment moods: rich at the bookends, varied across tips, quiet behind dense or demo stops. */
export const MOODS: Readonly<Record<string, Mood>> = {
  title: { ...RICH, grid: 0.6, contour: 0.4, ceiling: 0, calm: 0.4, warm: 0.85 },
  foreword: { ...RICH, contour: 0.5, warm: 0.55 },
  "tip-01-subagents": { ...TIP, warm: 0.3 },
  "tip-02-cache": QUIET,
  "tip-03-effort": { ...TIP, contour: 0.55, ceiling: 0 },
  "tip-04-superpowers": { ...TIP, warp: 0.95, warm: 0.65, ceiling: 0.45 },
  "tip-05-proc": { ...TIP, contour: 0.1, warm: 0.25 },
  "tip-06-cli-agents": { ...TIP, ceiling: 0.5, warm: 0.4 },
  "tip-07-headroom-rtk": { ...QUIET, contour: 0.35, warm: 0.2 },
  "tip-08-fable-cursor": { ...TIP, warp: 0.9, contour: 0.45, warm: 0.6 },
  "tip-09-suggestions": { ...TIP, warm: 0.35, ceiling: 0 },
  "tip-10-offers": { ...TIP, warp: 0.85, warm: 0.75 },
  "bonus-laya": { ...QUIET, warm: 0.15, ceiling: 0.3 },
  afterword: { ...TIP, contour: 0.5, warm: 0.5 },
  outro: { ...RICH, warp: 1.25, contour: 0.85, ceiling: 0.7 },
};

const KEYS = Object.keys(TIP) as (keyof Mood)[];

/** Story seconds over which neighbouring moods crossfade, centred on the boundary. */
const BLEND = 1.6;

export type MoodSegment = { id: string; window: MountWindow };
export type MoodStop = { at: number; holdSpan: number };

/** 0 inside a stop's hold, 1 mid-transit; eased over ~1.5 story seconds either side. */
export function transitAt(tau: number, stops: readonly MoodStop[]): number {
  let hold = 0;
  for (const s of stops) {
    const into = smoothstep(clamp((tau - (s.at - 1.6)) / 1.6));
    const out = 1 - smoothstep(clamp((tau - (s.at + s.holdSpan)) / 1.2));
    hold = Math.max(hold, into * out);
  }
  return 1 - hold;
}

/** Mood at τ: segment moods blended across boundaries, opened up in transit, quieter at stops. */
export function moodAt(
  tau: number,
  segments: readonly MoodSegment[],
  stops: readonly MoodStop[],
): Mood {
  const mood: Mood = { ...TIP };
  for (const k of KEYS) mood[k] = 0;
  let total = 0;
  segments.forEach(({ id, window }, i) => {
    const from = i === 0 ? 1 : smoothstep(clamp((tau - window.start) / BLEND + 0.5));
    const to =
      i === segments.length - 1 ? 1 : 1 - smoothstep(clamp((tau - window.end) / BLEND + 0.5));
    const w = from * to;
    if (w <= 0) return;
    const m = MOODS[id] ?? TIP;
    for (const k of KEYS) mood[k] += m[k] * w;
    total += w;
  });
  if (total <= 0) return { ...TIP };
  for (const k of KEYS) mood[k] /= total;
  const t = transitAt(tau, stops);
  mood.grid *= lerp(0.85, 1.15, t);
  mood.lights *= lerp(0.75, 1.2, t);
  mood.calm = clamp(mood.calm * lerp(1, 0.55, t));
  return mood;
}

export type Light = {
  x: number;
  y: number;
  z: number;
  /** 0 cool white … 1 clay, eased as the mood's warm share moves past this light */
  warmth: number;
  intensity: number;
};

const LIGHT_COUNT = 10;
/** Depth of the wrapped light field ahead of the camera. */
const LIGHT_DEPTH = 64;

const fract = (x: number) => x - Math.floor(x);
const hash = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43_758.545_3);

/** Sparse lights in a field that wraps ahead of the camera: half ride the warped floor, half float. */
export function lightsAt(rho: number, mood: Mood): Light[] {
  const camZ = -TRAVEL * rho;
  return Array.from({ length: LIGHT_COUNT }, (_, i) => {
    const ahead = LIGHT_DEPTH - fract((TRAVEL * rho) / LIGHT_DEPTH + hash(i + 1)) * LIGHT_DEPTH;
    const z = camZ - ahead + 2;
    const x = (hash(i + 11) - 0.5) * 26 + 0.8 * Math.sin(rho * 0.2 + i);
    const floating = i % 2 === 1;
    const y = floating
      ? 1.6 + hash(i + 21) * 4 + 0.35 * Math.sin(rho * 0.37 + i * 1.7)
      : heightAt(x, z, rho, mood.warp) + 0.06;
    const fadeIn = smoothstep(clamp((LIGHT_DEPTH - ahead) / 14));
    const fadeOut = smoothstep(clamp((ahead - 1) / 4));
    const pulse = 0.78 + 0.22 * Math.sin(rho * 0.9 + i * 2.3);
    return {
      x,
      y,
      z,
      warmth: smoothstep(clamp((mood.warm - hash(i + 31)) / 0.2 + 0.5)),
      intensity: mood.lights * fadeIn * fadeOut * pulse,
    };
  });
}

export type Parallax = { x: number; y: number; scale: number };

/** Max slide-plane drift (logical px) and scale. */
export const PARALLAX_PX = 12;
export const PARALLAX_SCALE = 0.012;

/**
 * Slide-plane drift: the camera tracks the slide, so it lags the crane slightly (opposite the
 * camera's lateral offset, down when the camera rises) and breathes with the dolly.
 */
export function parallaxAt(rho: number): Parallax {
  const c = cameraAt(rho);
  const x = clamp(-c.x / 1.7, -1, 1) * PARALLAX_PX;
  const y = clamp((c.y - 2.8) / 0.85, -1, 1) * PARALLAX_PX * 0.6;
  const scale = 1 + PARALLAX_SCALE * (0.5 + 0.5 * Math.sin(rho * 0.053 - 1.2));
  return { x, y, scale };
}
