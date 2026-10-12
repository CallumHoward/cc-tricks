import type { Eye, Fx, Mouth, Pose } from "./pose";
import { mixEye } from "./pose";

export type Expression = {
  eyeL: Partial<Eye>;
  eyeR?: Partial<Eye>;
  look?: readonly [number, number];
  mouth?: Mouth;
  mouthOpen?: number;
  blush?: number;
  sq?: number;
  lean?: number;
  fx?: Partial<Fx>;
};

const open = { open: 1, happy: 0, slant: 0, size: 1, glyph: "eye" } as const;

export const EXPRESSIONS = Object.freeze({
  neutral: { eyeL: open },
  happy: { eyeL: { ...open, happy: 1 }, mouth: "smile", blush: 0.6 },
  joy: {
    eyeL: { ...open, happy: 1, size: 1.1 },
    mouth: "grin",
    mouthOpen: 1,
    blush: 0.8,
    sq: 1.04,
  },
  surprised: {
    eyeL: { ...open, size: 1.3 },
    mouth: "o",
    mouthOpen: 1,
    sq: 1.06,
    fx: { alert: 1 },
  },
  curious: {
    eyeL: { ...open, size: 1.08 },
    eyeR: { ...open, open: 0.75, slant: 0.3 },
    look: [0.6, -0.6],
    mouth: "flat",
    lean: 4,
    fx: { question: 1 },
  },
  worried: {
    eyeL: { ...open, slant: -0.9, open: 0.9 },
    mouth: "wavy",
    look: [0, 0.2],
    fx: { sweat: 0.35 },
  },
  smug: {
    eyeL: { ...open, open: 0.45, slant: 0.2 },
    look: [-0.7, 0],
    mouth: "cat",
    blush: 0.4,
    lean: -3,
  },
  sleepy: {
    eyeL: { ...open, open: 0.12, slant: -0.4 },
    mouth: "o",
    mouthOpen: 0.35,
    sq: 0.97,
    lean: 5,
    fx: { zzz: 0.4 },
  },
  wink: { eyeL: open, eyeR: { ...open, happy: 1, open: 0 }, mouth: "smile", blush: 0.4 },
  determined: { eyeL: { ...open, open: 0.82, slant: 0.95 }, mouth: "flat", sq: 0.98 },
  sad: {
    eyeL: { ...open, slant: -1, open: 0.7, size: 0.95 },
    look: [0, 0.6],
    mouth: "frown",
    sq: 0.96,
  },
  sideEye: { eyeL: { ...open, open: 0.5 }, look: [1, 0], mouth: "flat" },
  dizzy: { eyeL: { ...open, glyph: "dizzy" }, mouth: "wavy", lean: -6 },
  limit: { eyeL: { ...open, glyph: "cross" }, mouth: "flat", sq: 0.94 },
  closed: { eyeL: { ...open, open: 0 }, mouth: "none" },
} satisfies Record<string, Expression>);

export type ExpressionName = keyof typeof EXPRESSIONS;

export const EXPRESSION_NAMES = Object.keys(EXPRESSIONS) as ExpressionName[];

/** Blends an expression into the pose by k (0 none, 1 full). */
export function applyExpression(pose: Pose, name: ExpressionName, k: number): void {
  if (k <= 0) return;
  const e: Expression = EXPRESSIONS[name];
  // Asymmetric slant is mirrored by the renderer, so both eyes share the same target by default.
  mixEye(pose.eyeL, e.eyeL, k);
  mixEye(pose.eyeR, e.eyeR ?? e.eyeL, k);
  if (e.look) {
    pose.lookX += (e.look[0] - pose.lookX) * k;
    pose.lookY += (e.look[1] - pose.lookY) * k;
  }
  if (e.mouth !== undefined && k >= 0.5) pose.mouth = e.mouth;
  pose.mouthOpen += ((e.mouthOpen ?? 0.6) - pose.mouthOpen) * k;
  pose.blush += ((e.blush ?? 0) - pose.blush) * k;
  if (e.sq !== undefined) pose.sq *= 1 + (e.sq - 1) * k;
  if (e.lean !== undefined) pose.lean += e.lean * k;
  if (e.fx) {
    for (const key of Object.keys(e.fx) as (keyof Fx)[]) {
      pose.fx[key] = Math.max(pose.fx[key], (e.fx[key] ?? 0) * k);
    }
  }
}
