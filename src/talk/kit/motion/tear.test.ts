import { describe, expect, it } from "vitest";

import { stubSwing, tearClips, tearEdge } from "./tear";

const geom = { width: 760, height: 300, perf: 590, seed: 7 };

describe("tear", () => {
  it("should keep the perforation straight before the tear starts", () => {
    expect(tearEdge(0, geom)).toEqual([]);
    expect(stubSwing(0)).toBe(0);
    expect(tearClips(0, geom).body).toContain("77.632% 0%");
  });

  it("should tear deterministically down to the progress point", () => {
    const edge = tearEdge(0.6, geom);
    expect(edge.at(-1)).toEqual([0, 180]);
    expect(tearEdge(0.6, geom)).toEqual(edge);
    expect(tearClips(0.6, geom)).toEqual(tearClips(0.6, geom));
  });
});
