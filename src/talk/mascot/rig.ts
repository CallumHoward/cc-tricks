import type { Arm, Eye, Leg, Pose } from "./pose";

/** Rig dimensions in px at scale 1; origin is the root (between the feet, on the ground), y down. */
export const RIG = Object.freeze({
  bodyW: 184,
  bodyH: 116,
  bodyD: 118,
  radiusTop: 46,
  radiusBottom: 32,
  dome: 5,
  legH: 22,
  legW: 18,
  /** Leg anchors [x, z] in body space: outer pair forward, inner pair back */
  legAt: [
    [-66, 30],
    [-40, -30],
    [40, -30],
    [66, 30],
  ] as const,
  shoulderInset: 9,
  shoulderY: -66,
  armLen: 30,
  armR: 10.5,
  handR: 12,
  eyeX: 35,
  eyeY: -82,
  eyeRx: 9.5,
  eyeRy: 15.5,
  mouthY: -64,
  line: 3.2,
});

export const PALETTE = Object.freeze({
  clay: "#d97757",
  shade: "#b65e3f",
  side: "#c56a4b",
  ink: "#2b1a14",
  eye: "#1c1412",
  ivory: "#faf9f5",
  soft: "#c9c7bc",
  muted: "#918f86",
  blush: "#eb9f7f",
  ground: "#1f1e1d",
});

/** Body-space y of the body's bottom and top edges at rest. */
export const BODY_BOTTOM = -RIG.legH;
export const BODY_TOP = -RIG.legH - RIG.bodyH;

type Range = readonly [number, number];

export const LIMITS = Object.freeze({
  sq: [0.7, 1.25] as Range,
  lean: [-20, 20] as Range,
  lift: [0, 280] as Range,
  bob: [-8, 14] as Range,
  look: [-1, 1] as Range,
  armRot: [-165, 80] as Range,
  armLen: [0.6, 1.6] as Range,
  armFwd: [-90, 90] as Range,
  legLift: [0, 18] as Range,
  legSwing: [-24, 24] as Range,
  eyeOpen: [0, 1] as Range,
  eyeHappy: [0, 1] as Range,
  eyeSlant: [-1, 1] as Range,
  eyeSize: [0.6, 1.4] as Range,
  mouthOpen: [0, 1] as Range,
  blush: [0, 1] as Range,
});

/** Pivot table for the sheet overlay: body-space position plus its travel or angle range. */
export const PIVOTS = Object.freeze([
  { id: "root", label: "root · squash/lean pivot", x: 0, y: 0, range: "sq 0.7–1.25 · lean ±20°" },
  { id: "hips", label: "hips · bob", x: 0, y: BODY_BOTTOM, range: "bob −8…+14 px" },
  {
    id: "shoulder",
    label: "shoulder",
    x: -(RIG.bodyW / 2 - RIG.shoulderInset),
    y: RIG.shoulderY,
    range: "rot −165°…+80° · len 0.6–1.6",
  },
  { id: "eye", label: "eye centre", x: -RIG.eyeX, y: RIG.eyeY, range: "look ±1 → ±9 px" },
  { id: "mouth", label: "mouth", x: 0, y: RIG.mouthY, range: "open 0–1" },
  { id: "foot", label: "foot", x: RIG.legAt[3][0], y: 0, range: "lift 0–18 · swing ±24 px" },
]);

const clamp = (v: number, [lo, hi]: Range) => Math.min(hi, Math.max(lo, v));

/** Volume-preserving squash: the body keeps its volume when depth scales with width (sx²·sy = 1). */
export function squashScale(sq: number): { sx: number; sy: number } {
  return { sx: 1 / Math.sqrt(sq), sy: sq };
}

function clampEye(e: Eye): Eye {
  return {
    open: clamp(e.open, LIMITS.eyeOpen),
    happy: clamp(e.happy, LIMITS.eyeHappy),
    slant: clamp(e.slant, LIMITS.eyeSlant),
    size: clamp(e.size, LIMITS.eyeSize),
    glyph: e.glyph,
  };
}

function clampArm(a: Arm): Arm {
  return {
    rot: clamp(a.rot, LIMITS.armRot),
    len: clamp(a.len, LIMITS.armLen),
    fwd: clamp(a.fwd, LIMITS.armFwd),
  };
}

function clampLeg(l: Leg): Leg {
  return { lift: clamp(l.lift, LIMITS.legLift), swing: clamp(l.swing, LIMITS.legSwing) };
}

/** Returns a copy of the pose with every joint inside its limits. */
export function clampPose(p: Pose): Pose {
  return {
    ...p,
    lift: clamp(p.lift, LIMITS.lift),
    sq: clamp(p.sq, LIMITS.sq),
    lean: clamp(p.lean, LIMITS.lean),
    bob: clamp(p.bob, LIMITS.bob),
    lookX: clamp(p.lookX, LIMITS.look),
    lookY: clamp(p.lookY, LIMITS.look),
    eyeL: clampEye(p.eyeL),
    eyeR: clampEye(p.eyeR),
    mouthOpen: clamp(p.mouthOpen, LIMITS.mouthOpen),
    blush: clamp(p.blush, LIMITS.blush),
    armL: clampArm(p.armL),
    armR: clampArm(p.armR),
    legs: [clampLeg(p.legs[0]), clampLeg(p.legs[1]), clampLeg(p.legs[2]), clampLeg(p.legs[3])],
    fx: { ...p.fx },
  };
}
