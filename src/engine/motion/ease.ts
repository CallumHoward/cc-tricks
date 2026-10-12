export type Ease = (u: number) => number;

export const clamp = (x: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, x));
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/** Maps x from [a0, a1] to [b0, b1] without clamping. */
export const remap = (x: number, a0: number, a1: number, b0: number, b1: number): number =>
  a1 === a0 ? b1 : b0 + ((x - a0) / (a1 - a0)) * (b1 - b0);

/** Eased 0→1 progress of x through [a, b], clamped. */
export const prog = (x: number, a: number, b: number, ease: Ease = linear): number =>
  ease(b === a ? (x >= b ? 1 : 0) : clamp((x - a) / (b - a)));

const linear: Ease = (u) => u;
export const inQuad: Ease = (u) => u * u;
export const outQuad: Ease = (u) => u * (2 - u);
export const inOutQuad: Ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
export const outCubic: Ease = (u) => 1 - (1 - u) ** 3;
export const inOutCubic: Ease = (u) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
export const inExpo: Ease = (u) => (u <= 0 ? 0 : 2 ** (10 * u - 10));
export const outExpo: Ease = (u) => (u >= 1 ? 1 : 1 - 2 ** (-10 * u));
export const inOutExpo: Ease = (u) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  return u < 0.5 ? 2 ** (20 * u - 10) / 2 : (2 - 2 ** (-20 * u + 10)) / 2;
};
export const outBack =
  (s = 1.70158): Ease =>
  (u) =>
    1 + (s + 1) * (u - 1) ** 3 + s * (u - 1) ** 2;
export const smoothstep: Ease = (u) => u * u * (3 - 2 * u);
export const smootherstep: Ease = (u) => u * u * u * (u * (u * 6 - 15) + 10);
