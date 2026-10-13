import { describe, expect, it } from "vitest";

import { BOT_HOME } from "#/talk/segments/shared/home";
import { homeDrift } from "#/talk/segments/shared/test-utils";

import {
  ADV,
  AT,
  botOffset,
  chipAt,
  CHIPS,
  completionOut,
  crateX,
  dockY,
  EXIT,
  HOLD_END,
  plateOut,
  scanAt,
  shotCam,
  TRANSCRIPT,
  transcriptLine,
  WIN,
} from "./tracks";

describe("tip 1 tracks", () => {
  it("should rest on the home shot at both window edges", () => {
    expect(homeDrift(WIN, dockY, botOffset)).toBeCloseTo(0, 3);
  });

  it("should keep the screenshot drifting at the stop while story time is frozen", () => {
    const now = shotCam(AT.agents, AT.agents);
    const later = shotCam(AT.agents, AT.agents + 0.5);
    expect(Math.abs(later.rotateY - now.rotateY) + Math.abs(later.y - now.y)).toBeGreaterThan(0.2);
  });

  it("should land the screenshot flat within a few degrees by the stop's settle time", () => {
    const settle = AT.agents - 0.8;
    expect(Math.abs(shotCam(settle, settle).rotateX)).toBeLessThan(3);
    expect(shotCam(settle, settle).opacity).toBe(1);
  });

  it("should dolly the screenshot out over at least 0.35 story seconds", () => {
    expect(shotCam(HOLD_END.agents + 0.3, 0).opacity).toBeGreaterThan(0);
    expect(shotCam(HOLD_END.agents + 0.5, 0).opacity).toBe(0);
  });

  it("should land both chips before the model stop settles", () => {
    for (const c of CHIPS) expect(c.land).toBeLessThanOrEqual(AT.model - 0.8);
  });

  it("should collapse every transcript line once the scan has read it and then hide the bar", () => {
    TRANSCRIPT.forEach((_, i) => {
      expect(transcriptLine(i, ADV.scan.start - 0.01)).toBeCloseTo(1, 5);
      expect(transcriptLine(i, ADV.scan.end)).toBe(0);
    });
    expect(scanAt(ADV.scan.end).opacity).toBe(0);
    expect(scanAt(AT.advisor).opacity).toBe(0);
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

  it("should take at least 0.35 story seconds to clear the plate", () => {
    expect(plateOut(EXIT.fold + 0.3).opacity).toBeGreaterThan(0);
    expect(plateOut(EXIT.foldEnd).opacity).toBe(0);
  });

  it("should clear the completion line before the window ends", () => {
    expect(EXIT.whipEnd - EXIT.whipAt).toBeGreaterThanOrEqual(0.35);
    expect(completionOut(EXIT.whipEnd).opacity).toBe(0);
    expect(EXIT.whipEnd).toBeLessThan(WIN.end);
  });
});
