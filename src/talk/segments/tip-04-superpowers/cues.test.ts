import { describe, expect, it } from "vitest";

import { CUES } from "./cues";
import { AT, HOLD_END, WIN } from "./tracks";

describe("tip 4 cues", () => {
  it("should place every cue inside the window and outside the hold", () => {
    for (const { tau } of CUES) {
      expect(tau).toBeGreaterThanOrEqual(WIN.start);
      expect(tau).toBeLessThan(WIN.end);
      expect(tau > AT && tau < HOLD_END).toBe(false);
    }
  });
});
