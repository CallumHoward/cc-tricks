import { describe, expect, it } from "vitest";

import { resolveTurn, turnCues } from "./turn-timing";

const spec = {
  out: { pastVerb: "Churned", duration: "1m 30s", at: 68.5, whipAt: 69.1 },
  in: { prompt: "2. Keep the cache warm", verb: "Simmering", typeAt: 69.9, submitAt: 70.9 },
};

describe("turn-timing", () => {
  it("should land the storyboard's tip 2 turn before the stop's legibility deadline", () => {
    const at = 76;
    expect(resolveTurn(spec).landing).toBeLessThan(at - 0.8);
  });

  it("should default each beat to follow the previous one", () => {
    const t = resolveTurn({
      in: { prompt: "1. Use subagents", verb: "Orchestrating", typeAt: 46 },
    });
    expect(t.typeEnd).toBeCloseTo(46 + 16 / 30);
    expect(t.submitAt).toBeGreaterThan(t.typeEnd ?? Infinity);
    expect(t.spinnerAt).toBeGreaterThan(t.submitAt ?? Infinity);
  });

  it("should not whip without an incoming prompt", () => {
    expect(resolveTurn({ out: spec.out }).whipAt).toBeUndefined();
  });

  it("should end ghost-accepted typing at the accept time", () => {
    const t = resolveTurn({
      in: {
        prompt: "",
        verb: "Lollygagging",
        typeAt: 222.9,
        ghost: { text: "9. Turn off prompt suggestions", at: 222.5, acceptAt: 223.4 },
      },
    });
    expect(t.typeEnd).toBe(223.4);
  });

  it("should emit cues in time order for the whole turn", () => {
    const cues = turnCues(spec);
    expect(cues.map((c) => c.cue)).toStrictEqual(["type", "whoosh", "type", "thud", "type"]);
    const taus = cues.map((c) => c.tau);
    expect(taus).toStrictEqual([...taus].sort((a, b) => a - b));
  });
});
