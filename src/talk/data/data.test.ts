import { describe, expect, it } from "vitest";

import { AA_POINTS, aaLabel } from "./aa";
import { LAYA_BARS } from "./laya";
import { coldToWarm, turnCost } from "./pricing";
import { chainLabel, chainWindows, clock12, ROUTINES } from "./routines";

describe("talk data", () => {
  it("should carry the corrected AA labels for the 56-point models", () => {
    const byLabel = new Map(AA_POINTS.map((p) => [aaLabel(p), p]));
    expect(byLabel.get("Opus 5.5 xhigh")?.costPerTaskUSD.toFixed(2)).toBe("3.46");
    expect(byLabel.get("Opus 5.5 xhigh")?.intelligenceIndex.toFixed(0)).toBe("56");
    expect(byLabel.get("Sonnet 5.5 max")?.costPerTaskUSD.toFixed(2)).toBe("5.46");
    expect(byLabel.get("Sonnet 5.5 max")?.intelligenceIndex.toFixed(0)).toBe("56");
    expect(AA_POINTS).toHaveLength(11);
  });

  it("should price a 100k Opus 5.5 turn at $0.02 warm and $0.80 cold", () => {
    expect(turnCost("opus-5.5", 100_000, "hit")).toBeCloseTo(0.02);
    expect(turnCost("opus-5.5", 100_000, "write1h")).toBeCloseTo(0.8);
    expect(coldToWarm("opus-5.5", "1h")).toBeCloseTo(40);
    expect(coldToWarm("fable-5.1", "5m")).toBeCloseTo(50);
    expect(coldToWarm("fable-5.1", "1h")).toBeCloseTo(80);
    expect(coldToWarm("haiku-5.5", "5m")).toBeCloseTo(12.5);
  });

  it("should switch Haiku 5.5 to its upper tier above 100k prompt tokens", () => {
    expect(turnCost("haiku-5.5", 100_000, "hit")).toBeCloseTo(0.001);
    expect(turnCost("haiku-5.5", 200_000, "hit")).toBeCloseTo(0.01);
  });

  it("should chain the three cloud routines into back-to-back 5h windows", () => {
    const windows = chainWindows(ROUTINES.map((r) => r.at));
    expect(windows.map(chainLabel)).toEqual([
      "05:30 ping → resets 10:30",
      "10:40 ping → resets 15:40",
      "15:50 ping → resets 20:50",
    ]);
    expect(ROUTINES.map((r) => clock12(r.at))).toEqual(["5:30 AM", "10:40 AM", "3:50 PM"]);
  });

  it("should not open a new window for a ping inside an open one", () => {
    expect(chainWindows([330, 400, 700])).toEqual([
      { ping: 330, start: 330, end: 630 },
      { ping: 700, start: 700, end: 1000 },
    ]);
  });

  it("should take the Laya bar values straight from the run", () => {
    expect(LAYA_BARS.map((b) => b.p)).toEqual([0.9653, 0.5565, 0.8248, 0.843]);
  });
});
