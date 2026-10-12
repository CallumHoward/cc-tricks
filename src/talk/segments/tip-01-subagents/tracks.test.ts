import { describe, expect, it } from "vitest";

import { sampleKeys } from "#/engine/motion/track";
import { BOT_HOME } from "#/talk/segments/shared/home";

import {
  AT,
  botOffset,
  chipAt,
  crateX,
  dockY,
  EXIT,
  HOLD_END,
  plateFold,
  spokeAt,
  spokeLand,
  SUBAGENTS,
  subagentTokens,
  WIN,
} from "./tracks";

describe("tip 1 tracks", () => {
  it("should rest on the home shot at both window edges", () => {
    for (const tau of [WIN.start, WIN.end - 0.01]) {
      expect(dockY(tau)).toBeCloseTo(0, 3);
      expect(botOffset(tau).x).toBeCloseTo(0, 3);
      expect(botOffset(tau).y).toBeCloseTo(0, 3);
    }
  });

  it("should land every spoke on its row's bullet before the stop settles", () => {
    SUBAGENTS.forEach((_, i) => {
      expect(spokeLand(i)).toBeLessThan(AT.agents - 0.8);
      expect(spokeAt(i, spokeLand(i)).ring).toBe(1);
    });
  });

  it("should creep each subagent counter by at most one last digit per story second in the hold", () => {
    SUBAGENTS.forEach((a, i) => {
      const track = subagentTokens(i);
      const rise = sampleKeys(track, HOLD_END.agents) - sampleKeys(track, AT.agents);
      expect(rise / 100 / (HOLD_END.agents - AT.agents)).toBeLessThanOrEqual(1);
      expect(sampleKeys(track, HOLD_END.agents)).toBe(a.tokens);
    });
  });

  it("should drift the effort chip no more than 6 px through the hold", () => {
    const start = chipAt(1, AT.model).x ?? 0;
    const end = chipAt(1, HOLD_END.model - 0.01).x ?? 0;
    expect(Math.abs(start - end)).toBeLessThanOrEqual(6);
  });

  it("should keep the bot behind the build.log crate while it creeps through the hold", () => {
    for (const tau of [AT.advisor, HOLD_END.advisor - 0.01]) {
      expect(botOffset(tau).x).toBeCloseTo(crateX(1, tau) - 190 - BOT_HOME.left, 3);
    }
  });

  it("should fold the plate shut before the completion line whips away", () => {
    expect(plateFold(EXIT.foldEnd).scaleY).toBe(0);
    expect(EXIT.whipEnd).toBeLessThan(WIN.end);
  });
});
