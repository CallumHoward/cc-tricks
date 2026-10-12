import { describe, expect, it } from "vitest";

import type { Frame } from "#/engine/types";

import { DEFAULT_POST, pulse, resolvePost, REWIND_CA, rewindAmount, shakeAt } from "./post-params";

const frame = (v: number): Frame => ({ tau: 3, v, w: 1, dt: 1 / 60 });

describe("post params", () => {
  it("should report no rewind while playing forward or holding", () => {
    expect(rewindAmount(1)).toBe(0);
    expect(rewindAmount(0.035)).toBe(0);
    expect(rewindAmount(0)).toBe(0);
  });

  it("should grow rewind intensity monotonically and saturate below 1", () => {
    const values = [-1, -2.5, -5, -10, -16].map(rewindAmount);
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1] ?? 0);
    expect(rewindAmount(-2.5)).toBeGreaterThan(0.4);
    expect(rewindAmount(-1e6)).toBeLessThanOrEqual(1);
  });

  it("should keep the default CA when playing forward", () => {
    expect(resolvePost(frame(1)).ca).toBe(DEFAULT_POST.ca);
  });

  it("should boost CA from rewind speed when velocity is negative", () => {
    const p = resolvePost(frame(-16));
    expect(p.ca).toBeGreaterThan(DEFAULT_POST.ca + REWIND_CA * 0.9);
    expect(p.ca).toBeLessThanOrEqual(DEFAULT_POST.ca + REWIND_CA);
  });

  it("should apply overrides in order and clamp fade", () => {
    const p = resolvePost(frame(1), { zoom: 1.02, fade: 3 }, { zoom: 1.04 });
    expect(p.zoom).toBe(1.04);
    expect(p.fade).toBe(1);
    expect(DEFAULT_POST.zoom).toBe(1);
  });

  it("should fire a pulse at its time and halve every half-life", () => {
    expect(pulse(0.9, 1, 0.1)).toBe(0);
    expect(pulse(1, 1, 0.1)).toBe(1);
    expect(pulse(1.1, 1, 0.1)).toBeCloseTo(0.5, 9);
  });

  it("should shake deterministically within the amplitude", () => {
    expect(shakeAt(2, 0)).toEqual([0, 0]);
    const a = shakeAt(2.37, 10, 3);
    expect(shakeAt(2.37, 10, 3)).toEqual(a);
    expect(Math.abs(a[0])).toBeLessThanOrEqual(10);
    expect(Math.abs(a[1])).toBeLessThanOrEqual(10);
    expect(shakeAt(2.37, 10, 4)).not.toEqual(a);
  });
});
