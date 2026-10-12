import { describe, expect, it } from "vitest";

import { sampleKeys } from "#/engine/motion/track";

import { AFT, BOT_WIDTH, captionWords, POSTER_ROTATE, posterCurl, WEEKLY } from "./tracks";

const used = (tau: number) => WEEKLY.map((bar) => Math.round(sampleKeys(bar.used, tau) * 100));

describe("afterword tracks", () => {
  it("should show the weekly bars at 88% and 95% when the limits stop lands", () => {
    expect(used(AFT.limitsAt - 0.8)).toEqual([88, 95]);
  });

  it("should drain the bars behind the poster", () => {
    expect(used(AFT.wantedAt)).toEqual([21, 1]);
  });

  it("should squeeze the bot to a sliver and widen it back", () => {
    expect(sampleKeys(BOT_WIDTH, AFT.limitsAt)).toBeCloseTo(0.2, 6);
    expect(sampleKeys(BOT_WIDTH, AFT.wantedAt)).toBeCloseTo(1, 6);
  });

  it("should finish typing the caption before the stop", () => {
    expect(captionWords(AFT.captionAt - 0.1, 16)).toBe(0);
    expect(captionWords(AFT.limitsAt - 0.8, 16)).toBe(16);
  });

  it("should only creep the poster during the hold", () => {
    const curl = posterCurl(AFT.wantedAt) - posterCurl(AFT.yank);
    expect(posterCurl(AFT.cut - 0.01)).toBe(0);
    expect(curl).toBeGreaterThan(0);
    expect(curl / (AFT.yank - AFT.wantedAt)).toBeLessThanOrEqual(30);
    const swing = sampleKeys(POSTER_ROTATE, AFT.yank) - sampleKeys(POSTER_ROTATE, AFT.wantedAt);
    expect(Math.abs(swing) / (AFT.yank - AFT.wantedAt)).toBeLessThanOrEqual(2);
  });
});
