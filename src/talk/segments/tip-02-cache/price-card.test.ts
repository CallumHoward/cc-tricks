import { describe, expect, it } from "vitest";

import { cardAt, highlightAt, onCard, REGIONS, SHOT } from "./price-card";
import { PRICE, T } from "./timing";

describe("tip 2 pricing card", () => {
  it("should keep the whole card width on stage through the push into the writes", () => {
    for (const tau of [PRICE.at, PRICE.at + PRICE.holdSpan, T.pushEnd]) {
      const p = cardAt(tau);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + SHOT.w * p.s).toBeLessThanOrEqual(1920);
    }
  });

  it("should push in slowly across the price hold without stopping", () => {
    const a = cardAt(PRICE.at).s;
    const b = cardAt(PRICE.at + PRICE.holdSpan / 2).s;
    const c = cardAt(PRICE.at + PRICE.holdSpan).s;
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(c / a).toBeLessThan(1.1);
  });

  it("should map image points through the card pose", () => {
    const p = cardAt(PRICE.at);
    expect(onCard(PRICE.at, 100, 200)).toEqual({ x: p.x + 100 * p.s, y: p.y + 200 * p.s });
  });

  it("should narrow the highlight from the caching columns to the write columns", () => {
    expect(highlightAt(PRICE.at)).toEqual(REGIONS.caching);
    expect(highlightAt(T.pushEnd)).toEqual(REGIONS.writes);
  });

  it("should drop the card off the bottom of the stage once the rings have flown", () => {
    expect(cardAt(T.cardGone).y).toBeGreaterThan(1080);
  });
});
