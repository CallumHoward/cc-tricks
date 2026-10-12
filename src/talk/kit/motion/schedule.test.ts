import { describe, expect, it } from "vitest";

import { SPRINGS, settleTime } from "#/engine/motion/spring";
import { keys } from "#/engine/motion/track";

import { flapAt, flapChar, layoutZones, splitWords, staggerStarts } from "./schedule";

describe("schedule", () => {
  it("should schedule the last staggered spring to settle exactly at settleBy", () => {
    const starts = staggerStarts(4, 10, 0.1, SPRINGS.LAND);
    expect((starts.at(-1) ?? 0) + settleTime(SPRINGS.LAND)).toBeCloseTo(10, 9);
    expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBeCloseTo(0.1, 9);
  });

  it("should split copy into lines on newline and give each word a stable id", () => {
    const { lines, words } = splitWords("10 tips for\nsaving tokens");
    expect(lines.map((l) => l.map((w) => w.text))).toEqual([
      ["10", "tips", "for"],
      ["saving", "tokens"],
    ]);
    expect(words.map((w) => w.id)).toEqual(["w0", "w1", "w2", "w3", "w4"]);
  });

  it("should land a flap on its target and show the source before it starts", () => {
    const o = { start: 1, stagger: 0, flips: 4, flipDur: 0.1 };
    expect(flapAt(0.5, 0, o)).toEqual({ step: 0, phase: 0 });
    expect(flapAt(2, 0, o)).toEqual({ step: 4, phase: 0 });
    expect(flapChar(" ", "A", 0, 4, 1)).toBe(" ");
    expect(flapChar(" ", "A", 4, 4, 1)).toBe("A");
    expect(flapChar(" ", "A", 2, 4, 1)).toBe(flapChar(" ", "A", 2, 4, 1));
  });

  it("should fill the width when no capacity is given and scale by capacity otherwise", () => {
    expect(layoutZones([1, 3], 0, 400)).toEqual([
      { x: 0, w: 100 },
      { x: 100, w: 300 },
    ]);
    const grow = keys([0, 0], [1, 50]);
    expect(layoutZones([50, grow], 1, 1000, 200).at(-1)).toEqual({ x: 250, w: 250 });
  });
});
