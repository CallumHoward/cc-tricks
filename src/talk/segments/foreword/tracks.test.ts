import { describe, expect, it } from "vitest";

import { BOT_HOME } from "#/talk/segments/shared/home";

import { MORPH_LANDS } from "./cues";
import {
  COMPOSER,
  CROWD,
  F,
  PROMPT_UP,
  botAt,
  cloneX,
  composerRect,
  crowdCells,
  highlightOffset,
  shadowAt,
} from "./tracks";

const home = { cx: BOT_HOME.left + BOT_HOME.width / 2, feet: BOT_HOME.top + BOT_HOME.height * 0.9 };

describe("foreword tracks", () => {
  it("should start and end with the bot at its home spot", () => {
    for (const tau of [F.start, F.homeAt]) {
      expect(botAt(tau)).toEqual({ ...home, s: 1 });
    }
  });

  it("should settle the composer before the chat-box stop and become the prompt box", () => {
    expect(composerRect(F.chatAt - 0.8)).toEqual(COMPOSER);
    expect(composerRect(F.toPrompt.end)).toEqual(PROMPT_UP);
  });

  it("should reach full composer height on the morph's thud cue", () => {
    expect(composerRect(MORPH_LANDS - 0.1).h).toBeLessThan(COMPOSER.h * 0.9);
    expect(composerRect(MORPH_LANDS).h).toBeGreaterThanOrEqual(COMPOSER.h * 0.98);
  });

  it("should have the clone 40% into frame at the chat-box stop", () => {
    expect(1920 - cloneX(F.chatAt)).toBeCloseTo(440);
  });

  it("should fill the crowd grid around our composer", () => {
    expect(crowdCells()).toHaveLength(CROWD.cols * CROWD.rows - 1);
  });

  it("should still be lengthening the shadow at the taste stop", () => {
    expect(shadowAt(F.tasteAt + 0.1).len).toBeGreaterThan(shadowAt(F.tasteAt).len);
  });

  it("should glide the highlight only its last 8 px inside the invest hold", () => {
    expect(highlightOffset(F.investAt)).toBeCloseTo(8);
    expect(highlightOffset(F.investHoldEnd)).toBe(0);
  });
});
