import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Act } from "./actions";
import {
  HOP,
  blinkAt,
  boilIndex,
  easeTravel,
  envelope,
  hopPose,
  poseAt,
  twosKey,
  walkPose,
} from "./actions";
import { EXPRESSION_NAMES } from "./expressions";
import { LIMITS } from "./rig";

const SCRIPT: readonly Act[] = Object.freeze([
  { kind: "face", at: 0.2, dur: 1, expr: "joy" },
  { kind: "wave", at: 0.4, dur: 1.2 },
  { kind: "hop", at: 1.8, height: 200 },
  { kind: "turn", at: 2.6, dur: 0.4, to: 90 },
  { kind: "walk", at: 3, dur: 2, dx: 240 },
  { kind: "celebrate", at: 5.2, dur: 1.5 },
  { kind: "surprised", at: 7, dur: 1 },
  { kind: "carry", at: 8, dur: 1 },
  { kind: "push", at: 9, dur: 1 },
  { kind: "type", at: 10, dur: 1 },
  { kind: "shrug", at: 11, dur: 1 },
  { kind: "sleepy", at: 12, dur: 2 },
  { kind: "point", at: 14, dur: 1, angle: -30 },
  { kind: "look", at: 15, dur: 1, x: -1, y: 0.4 },
  { kind: "sweat", at: 16, dur: 1 },
] satisfies Act[]);

const within = (v: number, [lo, hi]: readonly [number, number]) => v >= lo - 1e-9 && v <= hi + 1e-9;

describe("mascot actions", () => {
  it("should keep every joint inside its limits at any story and wall time", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1, max: 20, noNaN: true }),
        fc.double({ min: 0, max: 600, noNaN: true }),
        (tau, w) => {
          const p = poseAt(SCRIPT, tau, w);
          expect(within(p.sq, LIMITS.sq)).toBe(true);
          expect(within(p.lean, LIMITS.lean)).toBe(true);
          expect(within(p.lift, LIMITS.lift)).toBe(true);
          for (const arm of [p.armL, p.armR]) {
            expect(within(arm.rot, LIMITS.armRot)).toBe(true);
            expect(within(arm.len, LIMITS.armLen)).toBe(true);
          }
          for (const leg of p.legs) expect(within(leg.lift, LIMITS.legLift)).toBe(true);
        },
      ),
    );
  });

  it("should be a pure function of story time and wall time", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 18, noNaN: true }),
        fc.double({ min: 0, max: 60, noNaN: true }),
        (tau, w) => {
          const a = poseAt(SCRIPT, tau, w);
          poseAt(SCRIPT, tau + 3.7, w + 1.1);
          expect(poseAt(SCRIPT, tau, w)).toEqual(a);
        },
      ),
    );
  });

  it("should return the same pose whether the playhead arrives forwards or backwards", () => {
    const forward = [4, 4.5, 5].map((t) => poseAt(SCRIPT, t, 0));
    const backward = [5, 4.5, 4].map((t) => poseAt(SCRIPT, t, 0)).reverse();
    expect(backward).toEqual(forward);
  });

  it("should rest before any act starts", () => {
    const p = poseAt(SCRIPT, 0, 0, { ambient: false });
    expect(p.sq).toBe(1);
    expect(p.x).toBe(0);
    expect(p.yaw).toBe(0);
  });

  it("should keep facing and walked distance after turns and walks finish", () => {
    const p = poseAt(SCRIPT, 6, 0, { ambient: false });
    expect(p.yaw).toBe(90);
    expect(p.x).toBeCloseTo(240, 6);
  });

  it("should squash on anticipation, stretch at take-off and squash hard on impact", () => {
    expect(hopPose(HOP.anticipation - 1e-9).sq).toBeCloseTo(0.8, 3);
    expect(hopPose(HOP.anticipation + 1e-6).sq).toBeCloseTo(1.16, 3);
    expect(hopPose(HOP.anticipation + HOP.air + 0.05).sq).toBeCloseTo(0.72, 1);
    expect(hopPose(HOP.anticipation + HOP.air / 2, 100).lift).toBeCloseTo(100, 6);
    expect(hopPose(10)).toEqual({ lift: 0, sq: 1, arms: 0, eyes: 0 });
  });

  it("should alternate diagonal leg pairs across the two steps of a walk cycle", () => {
    const first = walkPose(0.125);
    const second = walkPose(0.625);
    expect(first.legs[0].lift).toBeGreaterThan(0);
    expect(first.legs[2].lift).toBe(first.legs[0].lift);
    expect(first.legs[1].lift).toBe(0);
    expect(second.legs[1].lift).toBeGreaterThan(0);
    expect(second.legs[0].lift).toBe(0);
  });

  it("should dip on contact and rise at passing", () => {
    expect(walkPose(0).sq).toBeCloseTo(0.94, 6);
    expect(walkPose(0.25).sq).toBeCloseTo(1.03, 6);
    expect(walkPose(0).bob).toBeGreaterThan(walkPose(0.25).bob);
  });

  it("should apply every expression without leaving the limits", () => {
    for (const expr of EXPRESSION_NAMES) {
      const p = poseAt([{ kind: "face", at: 0, dur: 2, expr }], 1, 0, { ambient: false });
      expect(within(p.eyeL.open, LIMITS.eyeOpen)).toBe(true);
      expect(within(p.eyeR.size, LIMITS.eyeSize)).toBe(true);
    }
  });

  it("should ramp envelopes in and out and hold for infinite durations", () => {
    expect(envelope(0, 1)).toBe(0);
    expect(envelope(0.5, 1)).toBe(1);
    expect(envelope(1.5, 1)).toBe(0);
    expect(envelope(100, Infinity)).toBe(1);
  });

  it("should travel monotonically and continuously from 0 to 1", () => {
    let prev = 0;
    for (let i = 0; i <= 1000; i++) {
      const v = easeTravel(i / 1000, 0.1);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-12);
      expect(v - prev).toBeLessThan(0.002);
      prev = v;
    }
    expect(easeTravel(1, 0.1)).toBe(1);
  });

  it("should blink briefly and deterministically on wall time", () => {
    let closed = 0;
    for (let i = 0; i < 6000; i++) {
      const b = blinkAt(i / 100);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(1);
      if (b > 0.5) closed++;
    }
    expect(closed / 6000).toBeLessThan(0.05);
    expect(closed).toBeGreaterThan(0);
    expect(blinkAt(12.34)).toBe(blinkAt(12.34));
  });

  it("should key drawings on story time at speed and on wall time in slo-mo", () => {
    expect(twosKey(1.0, 5, 1)).toBe(twosKey(1.08, 9, 1));
    expect(twosKey(1.0, 5, 1)).not.toBe(twosKey(1.1, 5, 1));
    expect(twosKey(1.0, 5, 0.04)).toBe(twosKey(1.01, 5.05, 0.04));
    expect(twosKey(1.0, 5, 0.04)).not.toBe(twosKey(1.0, 5.1, 0.04));
  });

  it("should cycle three boil drawings at twelve per second", () => {
    expect([0, 1 / 12, 2 / 12, 3 / 12].map((w) => boilIndex(w + 1e-6))).toEqual([0, 1, 2, 0]);
  });
});
