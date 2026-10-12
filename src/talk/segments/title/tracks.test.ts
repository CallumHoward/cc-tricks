import { describe, expect, it } from "vitest";

import { formatTokens } from "#/talk/kit/tui";

import {
  BLOCK_COUNT,
  T,
  TOTAL_TOKENS,
  blockAt,
  blockSlot,
  blocksInFlight,
  coldPunch,
  magnitudeCrossings,
  roadFraming,
  totalTokensAt,
} from "./tracks";

describe("title tracks", () => {
  it("should land the spinner counter on the real 1,031.4k total", () => {
    expect(TOTAL_TOKENS).toBe(1_031_400);
    expect(formatTokens(totalTokensAt(3))).toBe("1.03M");
  });

  it("should cross each order of magnitude in order, near the tick cues", () => {
    const [k10, k100, m1] = magnitudeCrossings();
    expect(k10).toBeCloseTo(0.9, 1);
    expect(k100).toBeGreaterThan(k10);
    expect(m1).toBeGreaterThan(k100);
    expect(m1).toBeLessThan(T.diveStart);
  });

  it("should only punch the camera while playing forward", () => {
    const crossings = magnitudeCrossings();
    const at = (crossings[1] ?? 0) + 0.05;
    expect(coldPunch(at, 1, crossings)).toBeGreaterThan(1);
    expect(coldPunch(at, 0, crossings)).toBe(1);
    expect(coldPunch(at, -2, crossings)).toBe(1);
  });

  it("should have three token blocks mid-fall at the title stop", () => {
    expect(blocksInFlight(T.titleAt)).toBe(3);
  });

  it("should rest every block exactly in its slot once landed", () => {
    for (let i = 0; i < BLOCK_COUNT; i++) {
      const { x, y } = blockAt(i, 40);
      expect({ x, y }).toEqual({ x: blockSlot(i).x, y: blockSlot(i).y });
    }
  });

  it("should frame the bar flat before the dive and after the crane", () => {
    expect(roadFraming(T.diveStart)).toBe(0);
    expect(roadFraming(T.titleAt)).toBe(1);
    expect(roadFraming(T.spoilerAt)).toBe(0);
  });
});
