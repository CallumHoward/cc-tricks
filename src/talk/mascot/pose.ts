/** Eye drawn as a dark pill cut by a lid line; every field morphs continuously except `glyph`. */
export type Eye = {
  /** 0 closed (a thin ‿ line) … 1 fully open */
  open: number;
  /** 0 pill … 1 happy ^ crescent */
  happy: number;
  /** −1 sad (inner corners up) … +1 determined (inner corners down) */
  slant: number;
  size: number;
  glyph: "eye" | "dizzy" | "cross";
};

export type Mouth = "none" | "smile" | "grin" | "o" | "flat" | "frown" | "wavy" | "cat";

/**
 * `rot` degrees from horizontal-outward (+ down, − up); `fwd` swings the arm toward the facing
 * direction.
 */
export type Arm = { rot: number; len: number; fwd: number };

/** `swing` moves the foot along the facing axis (px); `lift` raises it (px). */
export type Leg = { lift: number; swing: number };

export type Prop = "none" | "box" | "keyboard" | "crate";

/** Effect phases: 0 hidden; positive values drive each effect's own cycle or pop. */
export type Fx = { sweat: number; zzz: number; alert: number; question: number; sparkle: number };

export type Pose = {
  /** Screen x offset of the root (between the feet), px */
  x: number;
  /** Height of the feet above the ground, px */
  lift: number;
  /** Squash (<1) / stretch (>1) about the feet; width follows 1/√sq */
  sq: number;
  /** Degrees, clockwise, about the feet */
  lean: number;
  /** Turn in degrees: 0 front, 90 facing screen right, 180 back */
  yaw: number;
  /** Body drop relative to the planted legs, px (+ down) */
  bob: number;
  lookX: number;
  lookY: number;
  eyeL: Eye;
  eyeR: Eye;
  mouth: Mouth;
  mouthOpen: number;
  blush: number;
  armL: Arm;
  armR: Arm;
  /** Outer-left, inner-left, inner-right, outer-right */
  legs: [Leg, Leg, Leg, Leg];
  prop: Prop;
  /** Prop offset along the facing direction, px (crate distance, keyboard reach) */
  propReach: number;
  fx: Fx;
};

const REST_EYE: Eye = Object.freeze({ open: 1, happy: 0, slant: 0, size: 1, glyph: "eye" });
const REST_ARM: Arm = Object.freeze({ rot: 22, len: 1, fwd: 0 });

export function restPose(): Pose {
  return {
    x: 0,
    lift: 0,
    sq: 1,
    lean: 0,
    yaw: 0,
    bob: 0,
    lookX: 0,
    lookY: 0,
    eyeL: { ...REST_EYE },
    eyeR: { ...REST_EYE },
    mouth: "none",
    mouthOpen: 0,
    blush: 0,
    armL: { ...REST_ARM },
    armR: { ...REST_ARM },
    legs: [
      { lift: 0, swing: 0 },
      { lift: 0, swing: 0 },
      { lift: 0, swing: 0 },
      { lift: 0, swing: 0 },
    ],
    prop: "none",
    propReach: 0,
    fx: { sweat: 0, zzz: 0, alert: 0, question: 0, sparkle: 0 },
  };
}

const mix = (a: number, b: number, k: number) => a + (b - a) * k;

/** Blends eye `target` into `eye` by k; the discrete glyph switches at the halfway point. */
export function mixEye(eye: Eye, target: Partial<Eye>, k: number): void {
  if (k <= 0) return;
  if (target.open !== undefined) eye.open = mix(eye.open, target.open, k);
  if (target.happy !== undefined) eye.happy = mix(eye.happy, target.happy, k);
  if (target.slant !== undefined) eye.slant = mix(eye.slant, target.slant, k);
  if (target.size !== undefined) eye.size = mix(eye.size, target.size, k);
  if (target.glyph !== undefined && k >= 0.5) eye.glyph = target.glyph;
}

export function mixArm(arm: Arm, target: Partial<Arm>, k: number): void {
  if (k <= 0) return;
  if (target.rot !== undefined) arm.rot = mix(arm.rot, target.rot, k);
  if (target.len !== undefined) arm.len = mix(arm.len, target.len, k);
  if (target.fwd !== undefined) arm.fwd = mix(arm.fwd, target.fwd, k);
}
