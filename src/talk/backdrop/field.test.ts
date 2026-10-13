import { describe, expect, it } from "vitest";

import { fieldParticle } from "./field";

const DUST = 520;
const BOKEH = 26;
const range = (from: number, to: number) => Array.from({ length: to - from }, (_, k) => from + k);

describe("field particles", () => {
  it("should scatter dust across the travel corridor above the floor", () => {
    for (const p of range(0, DUST).map((i) => fieldParticle(i, DUST))) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(17);
      expect(p.y).toBeGreaterThanOrEqual(0.3);
      expect(p.y).toBeLessThanOrEqual(8.8);
      expect(p.seed[3]).toBe(0);
    }
  });

  it("should hug bokeh close to the lens at full brightness", () => {
    for (const p of range(DUST, DUST + BOKEH).map((i) => fieldParticle(i, DUST))) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(3);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1.7);
      expect(p.seed[3]).toBe(1);
      expect(p.brightness).toBe(0.9);
    }
  });

  it("should seed each particle identically every time so stills match", () => {
    expect(fieldParticle(42, DUST)).toEqual(fieldParticle(42, DUST));
    expect(fieldParticle(42, DUST)).not.toEqual(fieldParticle(43, DUST));
  });

  it("should warm only a minority of the particles", () => {
    const warm = range(0, DUST + BOKEH).filter((i) => fieldParticle(i, DUST).warm).length;
    expect(warm).toBeGreaterThan(0);
    expect(warm / (DUST + BOKEH)).toBeLessThan(0.3);
  });
});
