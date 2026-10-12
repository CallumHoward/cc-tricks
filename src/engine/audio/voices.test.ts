import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { fillNoise, smoothAccel, smoothstep, variation, voiceParams } from "#/engine/audio/voices";

const HOLD_SPEED = 0.035;

describe("audio voices", () => {
  it("should be silent while holding at slo-mo speed", () => {
    const p = voiceParams(HOLD_SPEED, 0);
    expect(p.whoosh.gain).toBeCloseTo(0);
    expect(p.tape.gain).toBeCloseTo(0);
    expect(p.warble.gain).toBe(0);
  });

  it("should be silent while cruising at 1x", () => {
    const p = voiceParams(1, 0);
    expect(p.whoosh.gain).toBe(0);
    expect(p.tape.gain).toBe(0);
    expect(p.warble.gain).toBe(0);
  });

  it("should swell the whoosh and open its filter as the playhead accelerates", () => {
    const gentle = voiceParams(0.6, 0.5);
    const hard = voiceParams(0.6, 2.5);
    expect(hard.whoosh.gain).toBeGreaterThan(gentle.whoosh.gain);
    expect(hard.whoosh.cutoff).toBeGreaterThan(gentle.whoosh.cutoff);
  });

  it("should drop the tape pitch with speed while braking", () => {
    const early = voiceParams(0.8, -1.5);
    const late = voiceParams(0.15, -1.5);
    expect(early.tape.gain).toBeGreaterThan(0);
    expect(late.tape.rate).toBeLessThan(early.tape.rate);
    expect(voiceParams(HOLD_SPEED, -1.5).tape.gain).toBeLessThan(0.01);
  });

  it("should warble only while rewinding, faster for faster rewinds", () => {
    expect(voiceParams(3, 0).warble.gain).toBe(0);
    const slow = voiceParams(-2.5, 0).warble;
    const fast = voiceParams(-12, 0).warble;
    expect(slow.gain).toBeGreaterThan(0);
    expect(fast.lfo).toBeGreaterThan(slow.lfo);
    expect(fast.rate).toBeGreaterThanOrEqual(slow.rate);
  });

  it("should keep every level finite and bounded for any velocity and acceleration", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -20, max: 20, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        (v, a) => {
          const p = voiceParams(v, a);
          for (const g of [p.whoosh.gain, p.tape.gain, p.warble.gain]) {
            expect(g).toBeGreaterThanOrEqual(0);
            expect(g).toBeLessThanOrEqual(1);
          }
          expect(p.whoosh.cutoff).toBeGreaterThan(0);
          expect(p.tape.rate).toBeGreaterThan(0);
        },
      ),
    );
  });

  it("should clamp smoothstep outside its edges", () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });

  it("should smooth acceleration towards the speed derivative and ignore zero-length frames", () => {
    expect(smoothAccel(0.3, 1, 2, 0)).toBe(0.3);
    const a = smoothAccel(0, 0.5, 1, 1 / 60);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(30);
    expect(smoothAccel(0, 1, -1.5, 1 / 60)).toBeGreaterThan(0);
  });

  it("should give stable, distinct variations in [0, 1)", () => {
    expect(variation("tip-3/type")).toBe(variation("tip-3/type"));
    expect(variation("a")).not.toBe(variation("b"));
    fc.assert(
      fc.property(fc.string(), (s) => {
        const x = variation(s);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(1);
      }),
    );
  });

  it("should fill reproducible noise in [-1, 1)", () => {
    const a = fillNoise(new Float32Array(512), 7);
    const b = fillNoise(new Float32Array(512), 7);
    expect([...a]).toEqual([...b]);
    expect(Math.min(...a)).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...a)).toBeLessThan(1);
    expect(fillNoise(new Float32Array(4), 0).some((x) => x !== 0)).toBe(true);
  });
});
