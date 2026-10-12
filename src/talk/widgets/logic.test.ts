import { describe, expect, it } from "vitest";

import { sliderToTokens, subagentTtl, tokensToSlider, ttlLeft, turnPrices } from "./logic";

describe("widget logic", () => {
  it("should span 10k to 1M tokens across the context slider", () => {
    expect(sliderToTokens(0)).toBe(10_000);
    expect(sliderToTokens(1000)).toBe(1_000_000);
    expect(sliderToTokens(tokensToSlider(100_000))).toBe(100_000);
  });

  it("should give the 100k Opus 5.5 turn prices from the storyboard", () => {
    const p = turnPrices("opus-5.5", 100_000);
    expect(p.base).toBeCloseTo(0.4);
    expect(p.write5m).toBeCloseTo(0.5);
    expect(p.write1h).toBeCloseTo(0.8);
    expect(p.hit).toBeCloseTo(0.02);
  });

  it("should let the subagent setting outrank an agent's 5m pin", () => {
    expect(subagentTtl(new Set())).toEqual({ ttl: "5m", winner: null });
    expect(subagentTtl(new Set(["env"]))).toEqual({ ttl: "1h", winner: "env" });
    expect(subagentTtl(new Set(["env", "pin"]))).toEqual({ ttl: "5m", winner: "pin" });
    expect(subagentTtl(new Set(["env", "pin", "setting"]))).toEqual({
      ttl: "1h",
      winner: "setting",
    });
  });

  it("should run a 5m ring out after a 7 minute test run", () => {
    expect(ttlLeft(7, "5m")).toBe(0);
    expect(ttlLeft(7, "1h")).toBeCloseTo(53 / 60);
  });
});
