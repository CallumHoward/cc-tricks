import { describe, expect, it } from "vitest";

import { STOPS } from "#/talk/timeline-data";

import { CUES } from "./cues";
import { TIP6 } from "./timing";

describe("tip-06-cli-agents cues", () => {
  it("should fire every cue inside the window and outside the holds", () => {
    const holds = STOPS.filter((stop) => stop.segment === "tip-06-cli-agents");
    expect(holds.length).toBeGreaterThan(0);
    for (const { tau } of CUES) {
      expect(tau).toBeGreaterThanOrEqual(TIP6.window.start);
      expect(tau).toBeLessThan(TIP6.window.end);
      for (const stop of holds) {
        expect(tau < stop.at || tau >= stop.at + stop.holdSpan).toBe(true);
      }
    }
  });
});
