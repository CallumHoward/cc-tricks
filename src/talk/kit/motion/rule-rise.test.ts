import { describe, expect, it } from "vitest";

import { SPRINGS } from "#/engine/motion/spring";

import { glintAt, planRise, riseAt } from "./rule-rise";
import { staggerStarts } from "./schedule";

const TITLE = "1. Use\nsubagents";
const REST = { x: 0, y: 0, rx: 0, rz: 0, s: 1 };

describe("rule rise", () => {
  it("should launch when the word-staggered rise did so segments clearing space keep their timing", () => {
    const plan = planRise(TITLE, 10);
    const wordFirst = staggerStarts(3, 10, 0.07, SPRINGS.LAND)[0];
    expect(Math.min(...plan.units.map((u) => u.start))).toBeCloseTo(wordFirst ?? 0, 9);
    expect(plan.ruleStart).toBeGreaterThanOrEqual((wordFirst ?? 0) - 0.35);
  });

  it("should punch the numeral in as one unit ahead of every letter", () => {
    const [numeral, ...letters] = planRise(TITLE, 10).units;
    expect(numeral).toMatchObject({ text: "1.", numeral: true });
    expect(letters.every((u) => !u.numeral && u.start > (numeral?.start ?? 0))).toBe(true);
    expect(letters.map((u) => u.text).join("")).toBe("Usesubagents");
  });

  it("should keep a symbol such as ≠ as a single letter", () => {
    const texts = planRise("8. Fable in CC ≠ Fable in Cursor", 5).units.map((u) => u.text);
    expect(texts).toContain("≠");
  });

  it("should hide every unit below the mask and the rule before launch", () => {
    const plan = planRise(TITLE, 10);
    const s = riseAt(plan.first - 0.01, plan);
    expect(s.units.every((p) => p.y >= 0.5)).toBe(true);
    expect(riseAt(plan.ruleStart - 0.01, plan).rule.draw).toBe(0);
  });

  it("should rest every unit exactly and draw the rule fully by settleBy", () => {
    const plan = planRise(TITLE, 10);
    const s = riseAt(10, plan, 20);
    expect(s.units).toEqual(plan.units.map(() => REST));
    expect(s.rule).toEqual({ draw: 1, retract: 0 });
  });

  it("should tighten loose tracking while the letters land", () => {
    const plan = planRise(TITLE, 10);
    const mid = riseAt((plan.first + 10) / 2, plan);
    const last = mid.units.at(-1);
    expect(last?.x).toBeGreaterThan(0);
  });

  it("should fold every letter away and retract the rule within half a second of exit", () => {
    const plan = planRise(TITLE, 10);
    const s = riseAt(20.5, plan, 20);
    expect(s.units.every((p) => p.y >= 1 && p.rx >= 70)).toBe(true);
    expect(s.rule.retract).toBe(1);
  });

  it("should sweep the glint along the rule then rest it between sweeps", () => {
    expect(glintAt(0)).toBe(0);
    expect(glintAt(1)).toBeGreaterThan(0);
    expect(glintAt(4)).toBeNull();
    expect(glintAt(-0.5)).toBeNull();
  });
});
