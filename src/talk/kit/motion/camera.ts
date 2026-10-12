import { clamp, lerp, type Ease } from "#/engine/motion/ease";

export const STAGE_W = 1920;
export const STAGE_H = 1080;
const CX = STAGE_W / 2;
const CY = STAGE_H / 2;

/** World point at screen center, zoom, roll and pitch (degrees). */
export type Cam = { x: number; y: number; zoom: number; roll: number; tilt: number };

export const HOME: Cam = Object.freeze({ x: CX, y: CY, zoom: 1, roll: 0, tilt: 0 });

/** A camera keyframe; omitted fields carry over from the previous shot. */
export type Shot = Partial<Cam> & {
  at: number;
  ease?: Ease;
  /** "linear" pans the center in a straight line instead of the fixed-point spiral */
  path?: "spiral" | "linear";
};

export type Point = { x: number; y: number };

const RAD = Math.PI / 180;

type C = [re: number, im: number];
const mul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const div = (a: C, b: C): C => {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
const sub = (a: C, b: C): C => [a[0] - b[0], a[1] - b[1]];
const add = (a: C, b: C): C => [a[0] + b[0], a[1] + b[1]];
const polar = (r: number, deg: number): C => [r * Math.cos(deg * RAD), r * Math.sin(deg * RAD)];

/** Screen position of a world point (ignoring tilt). */
export function toScreen(cam: Cam, p: Point): Point {
  const [x, y] = add(mul(polar(cam.zoom, cam.roll), [p.x - cam.x, p.y - cam.y]), [CX, CY]);
  return { x, y };
}

/**
 * Interpolates two cameras as a similarity transform: zoom in log space, roll linearly, and the one
 * world point both shots agree on stays fixed on screen.
 */
export function mixCam(a: Cam, b: Cam, u: number, path: Shot["path"] = "spiral"): Cam {
  const zoom = Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), u));
  const roll = lerp(a.roll, b.roll, u);
  const tilt = lerp(a.tilt, b.tilt, u);
  const a0 = polar(a.zoom, a.roll);
  const a1 = polar(b.zoom, b.roll);
  const au = polar(zoom, roll);
  const da = sub(a0, a1);
  if (path === "linear" || Math.hypot(da[0], da[1]) < 1e-9) {
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), zoom, roll, tilt };
  }
  const center: C = [CX, CY];
  const b0 = sub(center, mul(a0, [a.x, a.y]));
  const b1 = sub(center, mul(a1, [b.x, b.y]));
  const fixed = div(sub(b1, b0), da);
  const bu = sub(add(mul(a0, fixed), b0), mul(au, fixed));
  const [x, y] = div(sub(center, bu), au);
  return { x, y, zoom, roll, tilt };
}

/** The camera that zooms to `zoom` while keeping `focus` where it is on screen. */
export function zoomAbout(cam: Cam, focus: Point, zoom: number): Cam {
  const k = cam.zoom / zoom;
  return { ...cam, zoom, x: focus.x - (focus.x - cam.x) * k, y: focus.y - (focus.y - cam.y) * k };
}

function resolve(shots: readonly Shot[]): (Cam & Shot)[] {
  let prev: Cam = HOME;
  return [...shots]
    .sort((p, q) => p.at - q.at)
    .map((s) => {
      const next = {
        ...s,
        x: s.x ?? prev.x,
        y: s.y ?? prev.y,
        zoom: s.zoom ?? prev.zoom,
        roll: s.roll ?? prev.roll,
        tilt: s.tilt ?? prev.tilt,
      };
      prev = next;
      return next;
    });
}

/** Builds a τ → camera function from keyframed shots (holds before the first and after the last). */
export function shotTrack(shots: readonly Shot[]): (tau: number) => Cam {
  const list = resolve(shots);
  return (tau) => {
    if (list.length === 0) return HOME;
    const first = list[0] as Cam & Shot;
    if (tau <= first.at) return first;
    for (let i = 1; i < list.length; i++) {
      const next = list[i] as Cam & Shot;
      if (tau < next.at) {
        const prev = list[i - 1] as Cam & Shot;
        const u = clamp((tau - prev.at) / (next.at - prev.at));
        return mixCam(prev, next, next.ease ? next.ease(u) : u, next.path);
      }
    }
    return list[list.length - 1] as Cam;
  };
}

const n = (v: number, d = 3) => Number(v.toFixed(d));

/** CSS transform for a world element with `transform-origin: 0 0` under a perspective parent. */
export function camTransform(cam: Cam): string {
  return `translate3d(${CX}px, ${CY}px, 0) rotateX(${n(cam.tilt)}deg) rotate(${n(cam.roll)}deg) scale(${n(cam.zoom, 5)}) translate3d(${n(-cam.x)}px, ${n(-cam.y)}px, 0)`;
}

/** Screen velocity (px per τ-second) and log-zoom rate at τ, by backward difference. */
export function camVelocity(
  camAt: (tau: number) => Cam,
  tau: number,
  h = 1 / 120,
): { vx: number; vy: number; vz: number } {
  const now = camAt(tau);
  const before = camAt(tau - h);
  const was = toScreen(before, { x: now.x, y: now.y });
  return {
    vx: (CX - was.x) / h,
    vy: (CY - was.y) / h,
    vz: (Math.log(now.zoom) - Math.log(before.zoom)) / h,
  };
}

/** Directional smear (blur std-dev px) for one 60 Hz frame at playhead speed `v`. */
export function smearFor(
  vel: { vx: number; vy: number; vz: number },
  v: number,
  { shutter = 0.5, max = 24 } = {},
): { sx: number; sy: number } {
  const k = (Math.abs(v) * shutter) / 60;
  const radial = Math.abs(vel.vz) * k * 240;
  const sx = Math.min(max, Math.abs(vel.vx) * k + radial);
  const sy = Math.min(max, Math.abs(vel.vy) * k + radial);
  return { sx: sx < 0.4 ? 0 : n(sx, 1), sy: sy < 0.4 ? 0 : n(sy, 1) };
}
