import { describe, expect, it } from "vitest";

import { shakeAt } from "./clay-field";
import { grainFrame } from "./css-bed";
import { diveAt } from "./glyph-dive";
import { SPIN_GLYPH } from "./glyphs";
import { jitterAt } from "./rewind-overlay";
import { ruleRiseAt } from "./rule-rise";
import { stampAt } from "./stamp";

describe("motion primitives", () => {
  it("should rest every rule-rise word on the rule once settled", () => {
    const s = ruleRiseAt(5, [1, 1.07, 1.14]);
    expect(s.words).toEqual([0, 0, 0]);
    expect(s.rule).toBe(1);
    expect(ruleRiseAt(0, [1]).words[0]).toBe(1);
  });

  it("should rest the stamp at scale 1 by settleBy and creep its ink slowly", () => {
    const at = stampAt(3, 3, -9);
    expect(at.scale).toBeCloseTo(1, 2);
    expect(stampAt(1, 3, -9).shown).toBe(false);
    expect(stampAt(5, 3, -9).spread).toBeLessThanOrEqual(1);
  });

  it("should dive from 1x to the target zoom and center the focus", () => {
    const o = { at: { x: 196, y: 484 }, size: 36, glyph: SPIN_GLYPH, start: 1, end: 2.6 };
    expect(diveAt(0, o).scale).toBe(1);
    const end = diveAt(3, o);
    expect(end.scale).toBeCloseTo(30, 6);
    expect(end.tx + end.scale * 214).toBeCloseTo(960, 6);
    expect(end.plateScale).toBeCloseTo(1, 6);
  });

  it("should shake only while playing forward", () => {
    expect(shakeAt(1.05, [1], -1)).toEqual({ x: 0, y: 0 });
    expect(Math.abs(shakeAt(1.05, [1], 1).x) + Math.abs(shakeAt(1.05, [1], 1).y)).toBeGreaterThan(
      0,
    );
  });

  it("should keep ambient jitter and grain within bounds", () => {
    const j = jitterAt(12.34);
    expect(Math.abs(j.x)).toBeLessThanOrEqual(2);
    expect(grainFrame(1)).toBe(0);
    expect(grainFrame(1 + 1 / 24 + 1e-6)).toBe(1);
  });
});
