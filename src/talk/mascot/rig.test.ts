import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { restPose } from "./pose";
import { LIMITS, clampPose, squashScale } from "./rig";

describe("rig", () => {
  it("should preserve volume for any squash", () => {
    fc.assert(
      fc.property(fc.double({ min: 0.5, max: 1.5, noNaN: true }), (sq) => {
        const { sx, sy } = squashScale(sq);
        expect(sx * sx * sy).toBeCloseTo(1, 10);
        expect(sy).toBe(sq);
      }),
    );
  });

  it("should widen the body when squashed and narrow it when stretched", () => {
    expect(squashScale(0.8).sx).toBeGreaterThan(1);
    expect(squashScale(1.16).sx).toBeLessThan(1);
  });

  it("should clamp every joint into its limits", () => {
    const p = restPose();
    p.sq = 3;
    p.lean = -90;
    p.armL.rot = -400;
    p.armR.len = 9;
    p.legs[2].lift = 100;
    p.eyeL.open = 2;
    p.lookX = -5;
    const c = clampPose(p);
    expect(c.sq).toBe(LIMITS.sq[1]);
    expect(c.lean).toBe(LIMITS.lean[0]);
    expect(c.armL.rot).toBe(LIMITS.armRot[0]);
    expect(c.armR.len).toBe(LIMITS.armLen[1]);
    expect(c.legs[2].lift).toBe(LIMITS.legLift[1]);
    expect(c.eyeL.open).toBe(1);
    expect(c.lookX).toBe(-1);
  });

  it("should not mutate the pose it clamps", () => {
    const p = restPose();
    p.sq = 3;
    clampPose(p);
    expect(p.sq).toBe(3);
  });
});
