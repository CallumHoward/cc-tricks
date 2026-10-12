/** Glyph outlines in a 100×100 box, drawn as SVG paths so they survive a ×30 dive. */
export type Glyph = {
  d: string;
  box: number;
  focus: { x: number; y: number };
  rule?: "nonzero" | "evenodd";
};

function spoke(deg: number, len: number, half: number): string {
  const r = (deg * Math.PI) / 180;
  const [c, s] = [Math.cos(r), Math.sin(r)];
  const pt = (u: number, v: number) =>
    `${(50 + u * c - v * s).toFixed(2)} ${(50 + u * s + v * c).toFixed(2)}`;
  return `M${pt(-len, -half)}L${pt(len, -half)}L${pt(len, half)}L${pt(-len, half)}Z`;
}

/** ✳ eight-spoked asterisk: four bars of equal winding, unioned under nonzero fill. */
export const SPIN_GLYPH: Glyph = {
  d: [0, 45, 90, 135].map((a) => spoke(a, 46, 7.5)).join(""),
  box: 100,
  focus: { x: 50, y: 50 },
};

/** `0` with its counter as a separate evenodd subpath. */
export const ZERO_GLYPH: Glyph = {
  d: "M50 6C25 6 14 26 14 50s11 44 36 44 36-20 36-44S75 6 50 6Zm0 14c13 0 18 13 18 30s-5 30-18 30-18-13-18-30 5-30 18-30Z",
  box: 100,
  focus: { x: 50, y: 50 },
  rule: "evenodd",
};

/** Just the counter of `0`, for diving through the hole. */
export const ZERO_COUNTER: Glyph = {
  d: "M50 20c13 0 18 13 18 30s-5 30-18 30-18-13-18-30 5-30 18-30Z",
  box: 100,
  focus: { x: 50, y: 50 },
};
