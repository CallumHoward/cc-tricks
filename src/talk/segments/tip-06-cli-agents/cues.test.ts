import { describe, expect, it } from "vitest";

import { misplacedCues } from "#/talk/segments/shared/test-utils";

import { CUES } from "./cues";
import { TIP6 } from "./timing";

describe("tip-06-cli-agents cues", () => {
  it("should fire every cue inside the window and outside the holds", () => {
    expect(CUES.length).toBeGreaterThan(0);
    expect(misplacedCues("tip-06-cli-agents", TIP6.window, CUES)).toEqual([]);
  });
});
