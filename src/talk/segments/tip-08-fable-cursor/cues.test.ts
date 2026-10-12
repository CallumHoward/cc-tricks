import { describe, expect, it } from "vitest";

import { misplacedCues } from "#/talk/segments/shared/test-utils";

import { CUES } from "./cues";
import { TIP8 } from "./timing";

describe("tip-08-fable-cursor cues", () => {
  it("should fire every cue inside the window and outside the holds", () => {
    expect(CUES.length).toBeGreaterThan(0);
    expect(misplacedCues("tip-08-fable-cursor", TIP8.window, CUES)).toEqual([]);
  });
});
