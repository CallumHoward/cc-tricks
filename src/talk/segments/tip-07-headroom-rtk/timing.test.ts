import { describe, expect, it } from "vitest";

import { scriptFor } from "#/talk/script";

import { pressDepth, pullAt, splitAtSeparator, splitStat, TIP7 } from "./timing";

describe("tip 7 timing", () => {
  it("should split the headroom command at its -- separator", () => {
    const [a, b] = splitAtSeparator(scriptFor("t7-headroom").code[0]?.code ?? "");
    expect(a).toBe("headroom wrap claude --1m --");
    expect(b).toBe("--permission-mode auto --ide --model 'claude-opus-5-5[1m]'");
  });

  it("should split a dashboard stat into label and value", () => {
    expect(splitStat("Net +247.3k")).toEqual({ label: "Net", value: "+247.3k" });
    expect(splitStat("Saved by compression 1.4M")).toEqual({
      label: "Saved by compression",
      value: "1.4M",
    });
  });

  it("should only creep the press up after the crack", () => {
    const at = TIP7.headroom.at;
    const delta = pressDepth(at, TIP7.strokes, 0.06) - pressDepth(at + 1, TIP7.strokes, 0.06);
    expect(delta).toBeCloseTo(0.06);
    expect(pressDepth(TIP7.strokes[0] - 0.2, TIP7.strokes, 0.06)).toBe(0);
  });

  it("should keep the camera inside the terminal at both window boundaries", () => {
    expect(pullAt(TIP7.window.start)).toBe(0);
    expect(pullAt(TIP7.window.end)).toBe(0);
    expect(pullAt(TIP7.headroom.at)).toBe(1);
  });
});
