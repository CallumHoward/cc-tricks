import { describe, expect, it } from "vitest";

import { toneAt, wipeEdges } from "./cover-wipe";

describe("cover wipe", () => {
  it("should swap the tone at each wipe midpoint in either direction", () => {
    const wipes = [
      { start: 10, end: 11, to: "bone" as const },
      { start: 20, end: 21, to: "dark" as const },
    ];
    expect(toneAt("dark", wipes, 10.4)).toBe("dark");
    expect(toneAt("dark", wipes, 10.6)).toBe("bone");
    expect(toneAt("dark", wipes, 25)).toBe("dark");
  });

  it("should fully cover the stage at the wipe midpoint", () => {
    expect(wipeEdges(10.5, { start: 10, end: 11 })).toMatchObject({ lead: 1, trail: 0 });
    expect(wipeEdges(11, { start: 10, end: 11 })).toMatchObject({ lead: 1, trail: 1 });
  });
});
