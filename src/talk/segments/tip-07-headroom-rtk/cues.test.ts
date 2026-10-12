import { describe, expect, it } from "vitest";

import { stampImpact } from "#/talk/segments/tip-06-cli-agents/cue-timing";
import { STOPS } from "#/talk/timeline-data";

import { CUES } from "./cues";
import { TIP7 } from "./timing";

describe("tip-07-headroom-rtk cues", () => {
  it("should fire every cue inside the window and outside the holds", () => {
    const holds = STOPS.filter((stop) => stop.segment === "tip-07-headroom-rtk");
    expect(holds.length).toBeGreaterThan(0);
    for (const { tau } of CUES) {
      expect(tau).toBeGreaterThanOrEqual(TIP7.window.start);
      expect(tau).toBeLessThan(TIP7.window.end);
      for (const stop of holds) {
        expect(tau < stop.at || tau >= stop.at + stop.holdSpan).toBe(true);
      }
    }
  });

  it("should slam the stamp cue before the stamp settles", () => {
    const slam = stampImpact(TIP7.stamp);
    expect(slam).toBeGreaterThan(TIP7.stamp - 0.3);
    expect(slam).toBeLessThan(TIP7.stamp - 0.1);
    expect(CUES).toContainEqual({ tau: slam, cue: "slam" });
  });
});
