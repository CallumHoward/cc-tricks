import { describe, expect, it } from "vitest";

import { SLOTS, drawMascot, freeEnd } from "./draw";
import type { Pt } from "./geometry";
import { capsule } from "./geometry";
import { restPose } from "./pose";
import { RIG } from "./rig";

const bbox = (d: string) => {
  const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};

describe("drawMascot", () => {
  it("should draw the same pose identically every time", () => {
    expect(drawMascot(restPose(), 1)).toEqual(drawMascot(restPose(), 1));
  });

  it("should boil across three drawings and repeat on the fourth", () => {
    const p = restPose();
    expect(drawMascot(p, 0).clip).not.toBe(drawMascot(p, 1).clip);
    expect(drawMascot(p, 3).clip).toBe(drawMascot(p, 0).clip);
  });

  it("should not boil when the amplitude is zero", () => {
    const p = restPose();
    expect(drawMascot(p, 0, { boil: 0 })).toEqual(drawMascot(p, 2, { boil: 0 }));
  });

  it("should widen and flatten the body when squashed while keeping the line weight", () => {
    const rest = drawMascot(restPose(), 0, { boil: 0 });
    const squashed = drawMascot({ ...restPose(), sq: 0.8 }, 0, { boil: 0 });
    const a = bbox(rest.clip);
    const b = bbox(squashed.clip);
    expect(b.w / a.w).toBeCloseTo(1 / Math.sqrt(0.8), 1);
    expect(b.h / a.h).toBeCloseTo(0.8, 1);
    expect(squashed.shapes.line.sw).toBe(RIG.line);
  });

  it("should show a side face only when turned", () => {
    expect(drawMascot({ ...restPose(), yaw: 0 }).shapes.side.d).toBe("");
    expect(drawMascot({ ...restPose(), yaw: 35 }).shapes.side.d).not.toBe("");
  });

  it("should hide the face from behind", () => {
    const back = drawMascot({ ...restPose(), yaw: 180 });
    expect(back.shapes.eyeL.d).toBe("");
    expect(back.shapes.eyeR.d).toBe("");
  });

  it("should keep one eye visible in profile", () => {
    const side = drawMascot({ ...restPose(), yaw: 90 });
    expect([side.shapes.eyeL.d, side.shapes.eyeR.d].filter(Boolean)).toHaveLength(1);
  });

  it("should fill every visible part with one colour in silhouette mode", () => {
    const sil = drawMascot(restPose(), 0, { silhouette: "#000" });
    const fills = SLOTS.map((slot) => sil.shapes[slot])
      .filter((s) => s.d)
      .map((s) => s.fill);
    expect(new Set(fills)).toEqual(new Set(["#000"]));
    expect(sil.shapes.eyeL.d).toBe("");
  });

  it("should outline only the free end of a limb", () => {
    const a: Pt = [0, 0];
    const pts = capsule(a, [40, 0], 10, 12);
    const end = freeEnd(pts, a, 12);
    expect(end.length).toBeGreaterThan(4);
    expect(end.length).toBeLessThan(pts.length);
    for (const [x, y] of end) expect(Math.hypot(x, y)).toBeGreaterThan(12);
  });
});
