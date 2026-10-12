import { describe, expect, it } from "vitest";

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
  TICKS,
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

  it("should rest every subagent counter on a whole last digit from settle through the hold", () => {
    SUBAGENTS.forEach((a, i) => {
      const value = subagentTokens(i);
      for (const tau of [AT.agents - 0.8, AT.agents, 53.3, 54.2, HOLD_END.agents]) {
        expect(value(tau) % 100).toBe(0);
      }
      expect(value(HOLD_END.agents)).toBe(a.tokens);
    });
  });

  it("should tick each subagent counter at most one last digit per story second in the hold", () => {
    SUBAGENTS.forEach((_, i) => {
      const value = subagentTokens(i);
      const rise = value(HOLD_END.agents) - value(AT.agents);
      expect(rise / 100 / (HOLD_END.agents - AT.agents)).toBeLessThanOrEqual(1);
      expect(TICKS.at.every((t) => t > AT.agents && t + TICKS.snap < HOLD_END.agents)).toBe(true);
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
