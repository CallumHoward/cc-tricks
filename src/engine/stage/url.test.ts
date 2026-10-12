import { describe, expect, it } from "vitest";

import type { Stop } from "#/engine/types";

import { parseStageUrl } from "./url";

describe("parseStageUrl", () => {
  const STOPS: readonly Stop[] = [
    { id: "intro", at: 1, holdSpan: 1 },
    { id: "tip-02", at: 5, holdSpan: 1 },
  ];

  it("should freeze at τ and w from the query", () => {
    expect(parseStageUrl("?t=4.5&w=2", "", STOPS)).toEqual({ kind: "frozen", tau: 4.5, w: 2 });
  });

  it("should default w to τ when only t is given", () => {
    expect(parseStageUrl("?t=3", "", STOPS)).toEqual({ kind: "frozen", tau: 3, w: 3 });
  });

  it("should start at the stop named in the hash", () => {
    expect(parseStageUrl("", "#tip-02", STOPS)).toEqual({ kind: "stop", index: 1 });
  });

  it("should start at the first stop for unknown hashes or invalid times", () => {
    expect(parseStageUrl("?t=abc", "#nope", STOPS)).toEqual({ kind: "stop", index: 0 });
  });
});
