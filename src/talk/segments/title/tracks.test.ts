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
  spoilerPush,
  totalTokensAt,
} from "./tracks";

describe("title tracks", () => {
  it("should land the spinner counter on the real 1,031.4k total", () => {
    expect(TOTAL_TOKENS).toBe(1_031_400);
    expect(formatTokens(totalTokensAt(3))).toBe("1.03M");
  });

  it("should cross each order of magnitude on its tick cue", () => {
    const [k10 = 0, k100 = 0, m1 = 0] = magnitudeCrossings();
    expect(Math.abs(k10 - 0.9)).toBeLessThan(0.03);
    expect(Math.abs(k100 - 1.4)).toBeLessThan(0.03);
    expect(Math.abs(m1 - 1.9)).toBeLessThan(0.03);
  });

  it("should show a readable count the instant the spinner line appears", () => {
    expect(formatTokens(totalTokensAt(T.spinnerAt))).toBe("1.2k");
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

  it("should push in on the spoiler bar and return to the home framing for the exit", () => {
    const home = { x: 0, y: 0, s: 1 };
    expect(spoilerPush(T.craneEnd - 0.2, 20)).toEqual(home);
    expect(spoilerPush(T.spoilerAt).s).toBeGreaterThan(1.3);
    expect(spoilerPush(T.homeAt, 20)).toEqual(home);
  });
});
