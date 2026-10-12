import { describe, expect, it } from "vitest";

import { STOPS } from "#/talk/timeline-data";

import { CUES } from "./cues";
import { TIP8 } from "./timing";

describe("tip-08-fable-cursor cues", () => {
  it("should fire every cue inside the window and outside the holds", () => {
    const holds = STOPS.filter((stop) => stop.segment === "tip-08-fable-cursor");
    expect(holds.length).toBeGreaterThan(0);
    for (const { tau } of CUES) {
      expect(tau).toBeGreaterThanOrEqual(TIP8.window.start);
      expect(tau).toBeLessThan(TIP8.window.end);
      for (const stop of holds) {
        expect(tau < stop.at || tau >= stop.at + stop.holdSpan).toBe(true);
      }
    }
  });
});
