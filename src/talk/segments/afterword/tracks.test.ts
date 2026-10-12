import { describe, expect, it } from "vitest";

import { sampleKeys } from "#/engine/motion/track";

import {
  AFT,
  BOT_WIDTH,
  captionWords,
  limitsCamera,
  POSTER_ROTATE,
  posterCurl,
  WEEKLY,
  wordLines,
} from "./tracks";

const used = (tau: number) => WEEKLY.map((bar) => Math.round(sampleKeys(bar.used, tau) * 100));

describe("afterword tracks", () => {
  it("should show the weekly bars at 88% and 95% when the limits stop lands", () => {
    expect(used(AFT.limitsAt - 0.8)).toEqual([88, 95]);
  });

  it("should drain the bars behind the poster", () => {
    expect(used(AFT.wantedAt)).toEqual([21, 1]);
  });

  it("should squeeze the bot to a sliver and widen it back", () => {
    expect(sampleKeys(BOT_WIDTH, AFT.limitsAt)).toBeCloseTo(0.15, 6);
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

  it("should push in on the gauges by the stop and creep no more than 3% in the hold", () => {
    const settled = limitsCamera(AFT.limitsAt - 0.8).zoom;
    expect(settled).toBeGreaterThan(1.1);
    expect(limitsCamera(AFT.cut - 0.01).zoom / settled).toBeLessThanOrEqual(1.03);
  });

  it("should cut the camera back to the home framing with the poster", () => {
    expect(limitsCamera(AFT.cut)).toEqual({ x: 960, y: 540, zoom: 1, roll: 0, tilt: 0 });
  });

  it("should break copy into lines of the given word counts", () => {
    expect(wordLines("On the 5.5 models, I'm nowhere near my quota.", [4, 3])).toBe(
      "On the 5.5 models,\nI'm nowhere near\nmy quota.",
    );
  });
});
