import { describe, expect, it } from "vitest";

import { CUES } from "./cues";
import { AT, HOLD_END, WIN } from "./tracks";

const HOLDS = (["agents", "model", "advisor"] as const).map((k) => [AT[k], HOLD_END[k]] as const);

describe("tip 1 cues", () => {
  it("should place every cue inside the window and outside the holds", () => {
    for (const { tau } of CUES) {
      expect(tau).toBeGreaterThanOrEqual(WIN.start);
      expect(tau).toBeLessThan(WIN.end);
      expect(HOLDS.some(([a, b]) => tau > a && tau < b)).toBe(false);
    }
  });
});
