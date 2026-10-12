import { describe, expect, it } from "vitest";

import {
  glslVec3,
  hdr,
  hexToRgb,
  linear,
  LINEAR,
  linearToSrgb,
  PALETTE,
  srgbToLinear,
} from "./palette";

describe("palette", () => {
  it("should parse hex colors with or without a hash", () => {
    expect(hexToRgb("#ff8000")).toEqual([1, 128 / 255, 0]);
    expect(hexToRgb("FF8000")).toEqual([1, 128 / 255, 0]);
  });

  it("should reject malformed hex colors", () => {
    expect(() => hexToRgb("#fff")).toThrow(/Invalid hex/);
  });

  it("should round-trip between sRGB and linear", () => {
    for (const c of [0, 0.02, 0.04045, 0.2, 0.5, 0.9, 1]) {
      expect(linearToSrgb(srgbToLinear(c))).toBeCloseTo(c, 5);
    }
  });

  it("should keep ivory text below the bloom threshold and clay below 1", () => {
    expect(Math.max(...LINEAR.text)).toBeLessThan(1);
    expect(Math.max(...LINEAR.text)).toBeCloseTo(0.956, 2);
    expect(Math.max(...LINEAR.clay)).toBeCloseTo(0.694, 2);
  });

  it("should scale linear values for HDR authoring", () => {
    const [r, g, b] = hdr(PALETTE.clay, 2);
    const [lr, lg, lb] = linear(PALETTE.clay);
    expect([r, g, b]).toEqual([lr * 2, lg * 2, lb * 2]);
    expect(r).toBeGreaterThan(1);
  });

  it("should format a GLSL vec3 literal", () => {
    expect(glslVec3([1, 0.5, 0])).toBe("vec3(1.00000, 0.50000, 0.00000)");
  });
});
