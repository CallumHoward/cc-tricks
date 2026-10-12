import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { inQuad, smoothstep } from "./ease";
import { settleTime, SPRINGS } from "./spring";
import { keys, lastLanding, pathTrack, sampleKeys, sampleTrack, type TrackSpec } from "./track";

describe("track", () => {
  const spec: TrackSpec = {
    x: keys([1, 0], [2, 100], [4, 50, inQuad]),
    opacity: keys([1, 0], [1.5, 1, SPRINGS.FADE]),
    "--glow": keys([0, 3]),
  };

  it("should hold the first value before the first key and the last after the last", () => {
    expect(sampleTrack(spec, -10)).toEqual({ x: 0, opacity: 0, "--glow": 3 });
    expect(sampleTrack(spec, 99)).toEqual({ x: 50, opacity: 1, "--glow": 3 });
  });

  it("should interpolate linearly by default and apply the arriving key's ease", () => {
    expect(sampleTrack(spec, 1.5).x).toBe(50);
    expect(sampleTrack(spec, 3).x).toBe(100 - 50 * inQuad(0.5));
  });

  it("should hit every key value exactly at its time", () => {
    expect(sampleKeys(spec.x ?? [], 2)).toBe(100);
    expect(sampleKeys(spec.x ?? [], 4)).toBe(50);
    expect(sampleKeys(spec.opacity ?? [], 1.5)).toBe(1);
  });

  it("should land spring-eased keys exactly at their time", () => {
    const short = keys([0, 0], [0.05, 1, SPRINGS.SLAM]);
    expect(sampleKeys(short, 0.05 - 1e-9)).toBeCloseTo(1, 6);
    expect(sampleKeys(short, 0.05)).toBe(1);
  });

  it("should overshoot inside an underdamped spring tween", () => {
    const track = keys([0, 0], [2, 1, SPRINGS.POP]);
    const peak = Math.max(...Array.from({ length: 200 }, (_, i) => sampleKeys(track, i / 100)));
    expect(peak).toBeGreaterThan(1.1);
  });

  it("should step on keys that share a time", () => {
    const track = keys([1, 0], [1, 10], [2, 20]);
    expect(sampleKeys(track, 0.999)).toBe(0);
    expect(sampleKeys(track, 1)).toBe(10);
    expect(sampleKeys(track, 1.5)).toBe(15);
  });

  it("should return NaN for an empty channel and skip it when sampling a spec", () => {
    expect(sampleKeys([], 1)).toBeNaN();
    expect(sampleTrack({ x: [] }, 1)).toEqual({});
  });

  it("should reuse the output object when given one", () => {
    const out = {};
    expect(sampleTrack(spec, 2, out)).toBe(out);
    expect(out).toMatchObject({ x: 100 });
  });

  it("should sort keys and accept object keys", () => {
    const k = keys({ at: 3, value: 1 }, [1, 0, smoothstep]);
    expect(k.map((x) => x.at)).toEqual([1, 3]);
    expect(k[0]?.ease).toBe(smoothstep);
    expect(Object.isFrozen(k)).toBe(true);
  });

  it("should sample the same value for the same τ regardless of history", () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: -2, max: 6, noNaN: true }), { minLength: 2 }),
        (taus) => {
          const fresh = taus.map((t) => sampleTrack(spec, t));
          const out = {};
          const reused = taus.map((t) => ({ ...sampleTrack(spec, t, out) }));
          expect(reused).toEqual(fresh);
        },
      ),
    );
  });

  it("should be continuous between keys", () => {
    fc.assert(
      fc.property(fc.double({ min: -1, max: 5, noNaN: true }), (tau) => {
        const a = sampleTrack(spec, tau);
        const b = sampleTrack(spec, tau + 1e-6);
        expect(Math.abs((a.x ?? 0) - (b.x ?? 0))).toBeLessThan(1e-3);
        expect(Math.abs((a.opacity ?? 0) - (b.opacity ?? 0))).toBeLessThan(1e-3);
      }),
    );
  });

  it("should report the last landing across channels", () => {
    expect(lastLanding(spec)).toBe(4);
    expect(lastLanding({ y: keys([0, 0], [5, 1, SPRINGS.FADE]) })).toBeCloseTo(
      settleTime(SPRINGS.FADE),
      9,
    );
    expect(lastLanding({ y: keys([0, 0], [1, 1], [3, 1]) })).toBe(1);
    expect(lastLanding({})).toBe(Number.NEGATIVE_INFINITY);
  });

  const A = "M 0 0 L 100 0 L 100 100 Z";
  const B = "M 0 0 L 200 0 L 200 200 Z";

  it("should morph paths and hold the end shapes", () => {
    const d = pathTrack([
      { at: 2, d: B, ease: smoothstep },
      { at: 1, d: A },
    ]);
    expect(d(0)).toBe(A);
    expect(d(1)).toBe(A);
    expect(d(2)).toBe(B);
    expect(d(9)).toBe(B);
    const mid = d(1.5);
    expect(mid).toMatch(/^M\s*0[\s,]+0/);
    expect(mid).toContain("150");
    expect(d(1.5)).toBe(mid);
  });

  it("should return an empty path without keys", () => {
    expect(pathTrack([])(1)).toBe("");
  });
});
