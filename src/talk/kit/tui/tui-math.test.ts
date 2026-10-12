import { describe, expect, it } from "vitest";

import {
  caretOn,
  detent,
  drumSlots,
  formatElapsed,
  formatTokens,
  pileTiles,
  punch,
  quantize,
  recapPosition,
  resolveCount,
  spinnerGlyph,
  spinnerVerb,
  typedChars,
  whipOffset,
} from "./tui-math";
import { typeClip } from "./use-frame-ref";

describe("tui-math", () => {
  it("should quantize τ up to the next 60 Hz step", () => {
    expect(quantize(1)).toBe(1);
    expect(quantize(1.001)).toBeCloseTo(1 + 1 / 60);
  });

  it("should type whole characters and clamp to the text length", () => {
    expect(typedChars(0.99, 1, 60, 10)).toBe(0);
    expect(typedChars(1.05, 1, 60, 10)).toBe(3);
    expect(typedChars(9, 1, 60, 10)).toBe(10);
  });

  it("should ping-pong the spinner glyph every 120 ms", () => {
    const frames = Array.from({ length: 13 }, (_, i) => spinnerGlyph(i * 0.12 + 0.01));
    expect(frames.join("")).toBe("·✢✳✶✻✽✽✻✶✳✢··");
  });

  it("should cycle the spinner for negative wall time", () => {
    expect(spinnerGlyph(-0.05)).toBe("·");
  });

  it("should read Moonwalking while rewinding", () => {
    expect(spinnerVerb("Orchestrating", 10, 1)).toBe("Orchestrating");
    expect(spinnerVerb("Orchestrating", 10, -2.5)).toBe("Moonwalking");
  });

  it("should pick the latest keyed verb at τ", () => {
    const keys = [
      { at: 0, verb: "Ruminating" },
      { at: 5, verb: "Pouncing" },
    ];
    expect(spinnerVerb(keys, 4.9, 1)).toBe("Ruminating");
    expect(spinnerVerb(keys, 5, 1)).toBe("Pouncing");
  });

  it("should format elapsed time like Claude Code", () => {
    expect(formatElapsed(0)).toBe("0s");
    expect(formatElapsed(45.9)).toBe("45s");
    expect(formatElapsed(60)).toBe("1m");
    expect(formatElapsed(90)).toBe("1m 30s");
    expect(formatElapsed(29 * 60 + 29)).toBe("29m 29s");
  });

  it("should format token counts with k and M units", () => {
    expect(formatTokens(0)).toBe("0");
    expect(formatTokens(999)).toBe("999");
    expect(formatTokens(1200)).toBe("1.2k");
    expect(formatTokens(97_300)).toBe("97.3k");
    expect(formatTokens(171_900)).toBe("171.9k");
    expect(formatTokens(1_031_400)).toBe("1.03M");
  });

  it("should hold the detent at rest for most of a step", () => {
    expect(detent(0.3)).toBe(0);
    expect(detent(1)).toBe(1);
  });

  it("should only move higher drums while lower drums carry", () => {
    const resting = drumSlots(123.7, 1, 4);
    expect(resting[0]?.pos).toBeCloseTo(3 + detent(0.7));
    expect(resting.slice(1).map((s) => s.pos)).toStrictEqual([2, 1, 0]);
    const carrying = drumSlots(199.9, 1, 4);
    expect(carrying[1]?.pos).toBeCloseTo(9 + detent(0.9));
    expect(carrying[2]?.pos).toBeCloseTo(1 + detent(0.9));
  });

  it("should widen a new leading digit as it rolls in", () => {
    const slots = drumSlots(99.9, 1, 4);
    expect(slots[2]?.width).toBeCloseTo(detent(0.9));
    expect(slots[3]?.width).toBe(0);
    expect(drumSlots(12, 1, 4).map((s) => s.width)).toStrictEqual([1, 1, 0, 0]);
  });

  it("should not punch when paused or rewinding", () => {
    expect(punch(1.05, 1, 1)).toBeGreaterThan(0);
    expect(punch(1.05, 0, 1)).toBe(0);
    expect(punch(1.05, -2, 1)).toBe(0);
    expect(punch(2, 1, 1)).toBe(0);
  });

  it("should keep the caret solid while typing", () => {
    expect(caretOn(0.9, true)).toBe(true);
    expect(caretOn(0.9, false)).toBe(false);
    expect(caretOn(0.1, false)).toBe(true);
  });

  it("should resolve counts from numbers, keys and functions", () => {
    expect(resolveCount(4)(9)).toBe(4);
    expect(
      resolveCount([
        { at: 0, value: 0 },
        { at: 1, value: 10 },
      ])(0.5),
    ).toBe(5);
    expect(resolveCount((t) => t * 2)(3)).toBe(6);
  });

  it("should land pile tiles at their slots and hide uncounted ones", () => {
    const tiles = pileTiles(2, 4, 30);
    expect(tiles.map((t) => t.visible)).toStrictEqual([true, true, false, false]);
    const entering = pileTiles(2.5, 4, 30)[2];
    expect(entering?.visible).toBe(true);
    expect(entering?.y).toBeLessThan(pileTiles(3, 4, 30)[2]?.y ?? 0);
  });

  it("should whip a full distance by the end of its window", () => {
    expect(whipOffset(0, 1, 0.5, 1080)).toBe(0);
    expect(whipOffset(2, 1, 0.5, 1080)).toBe(1080);
  });

  it("should dwell on each recap line", () => {
    expect(recapPosition(0, 0, 10, 11)).toBe(0);
    expect(recapPosition(1.02, 0, 10, 11)).toBeCloseTo(1, 1);
    expect(recapPosition(10, 0, 10, 11)).toBe(10);
  });

  it("should reveal whole cells while typing and drop the clip once typed", () => {
    expect(typeClip(3, 10)).toContain("calc(100% - 3ch)");
    expect(typeClip(10, 10)).toBe("none");
  });
});
