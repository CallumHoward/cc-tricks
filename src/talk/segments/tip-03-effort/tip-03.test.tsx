import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { AA_POINTS, type AaEffort } from "#/talk/data/aa";
import { HOP } from "#/talk/mascot/actions";
import { LINKS, scriptFor } from "#/talk/script";

import { foldAt, lineLift } from "./bracket";
import { AA_SHOT, chartPose, dotAt, OPUS_DOTS } from "./chart-plate";
import { glyphAt, glyphLandAt, needleSeat } from "./dial-plate";
import { EFFORTS, T3 } from "./timing";
import { typedCount, type Pt } from "./tracks";
import Tip03EffortSegment, { botPath, hopAt, landAt } from "./view";

const gap = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function opus(effort: AaEffort) {
  const p = AA_POINTS.find((q) => q.model === "Claude Opus 5.5" && q.effort === effort);
  if (!p) throw new Error(`No Opus 5.5 ${effort} point`);
  return { x: Math.log10(p.costPerTaskUSD), y: p.intelligenceIndex };
}

describe("tip 3 effort", () => {
  it("should type whole characters and never past the end", () => {
    expect(typedCount(1, 1, 10, 5)).toBe(0);
    expect(typedCount(1.25, 1, 10, 5)).toBe(2);
    expect(typedCount(9, 1, 10, 5)).toBe(5);
  });

  it("should creep the dial needle no faster than 3 degrees per second in the hold", () => {
    const degPerSec = ((needleSeat(T3.lastGen.holdEnd) - needleSeat(T3.lastGen.at)) * 35) / 2.5;
    expect(degPerSec).toBeGreaterThan(0);
    expect(degPerSec).toBeLessThanOrEqual(3);
  });

  it("should label the dial with every effort level when frozen at t3-then", () => {
    renderAt(T3.lastGen.at, <Tip03EffortSegment />);
    for (const label of scriptFor("t3-then").ui) expect(screen.getByLabelText(label)).toBeVisible();
  });

  it("should keep the seated glyphs turning on ambient time while the story is held", () => {
    const at = T3.lastGen.at;
    expect(glyphAt(2, at, at + 1).rotate).not.toBe(glyphAt(2, at, at).rotate);
  });

  it("should place every measured Opus dot where the chart's log cost and index axes put it", () => {
    const [high, max] = [opus("high"), opus("max")];
    const [pxHigh, pxMax] = [OPUS_DOTS[2], OPUS_DOTS[4]];
    const sx = (pxMax.x - pxHigh.x) / (max.x - high.x);
    const sy = (pxMax.y - pxHigh.y) / (max.y - high.y);
    EFFORTS.forEach((effort, i) => {
      const p = opus(effort);
      const fit = { x: pxHigh.x + sx * (p.x - high.x), y: pxHigh.y + sy * (p.y - high.y) };
      expect(gap(fit, OPUS_DOTS[i] ?? pxHigh)).toBeLessThan(3);
    });
  });

  it("should drop each dial glyph into its Opus dot on the screenshot", () => {
    EFFORTS.forEach((_, i) => {
      const at = glyphLandAt(i);
      const g = glyphAt(i, at, at + 0.3);
      expect(gap({ x: (g.x ?? 0) + 50, y: (g.y ?? 0) + 50 }, dotAt(i, at, at + 0.3))).toBeLessThan(
        0.5,
      );
      expect(glyphAt(i, at + 0.16).scale).toBe(0);
    });
  });

  it("should hold the screenshot flat whenever the bot stands on it", () => {
    for (let tau = hopAt(0) - 0.3; tau <= T3.aa.holdEnd; tau += 0.05) {
      const pose = chartPose(tau, tau * 1.7);
      expect(Math.hypot(pose.rx, pose.ry)).toBe(0);
    }
  });

  it("should take off from and touch down on consecutive Opus dots on every hop", () => {
    for (let k = 0; k < OPUS_DOTS.length - 1; k++) {
      const off = hopAt(k) + HOP.anticipation;
      expect(gap(botPath(off, off + 2), dotAt(k, off, off + 2))).toBeLessThan(0.5);
      expect(gap(botPath(landAt(k), 9), dotAt(k + 1, landAt(k), 9))).toBeLessThan(0.5);
    }
  });

  it("should carry the bot's feet through every hop without jumping", () => {
    const step = 0.002;
    for (let tau = 143.0; tau < T3.aa.holdEnd; tau += step) {
      expect(gap(botPath(tau, tau), botPath(tau + step, tau + step))).toBeLessThan(5);
    }
  });

  it("should stand the bot on Opus 5.5 max at the stop, having just landed there", () => {
    const max = OPUS_DOTS.length - 1;
    expect(landAt(max - 1)).toBeCloseTo(T3.aa.at, 9);
    expect(gap(botPath(T3.aa.at, T3.aa.at), dotAt(max, T3.aa.at, T3.aa.at))).toBeLessThan(0.5);
  });

  it("should keep the bot's feet on its dot while the screenshot drifts in slow motion", () => {
    const tau = T3.aa.at + 1;
    const max = OPUS_DOTS.length - 1;
    expect(gap(dotAt(max, tau, 150), dotAt(max, tau, 152))).toBeGreaterThan(1);
    for (const rho of [150, 151, 152, 153]) {
      expect(gap(botPath(tau, rho), dotAt(max, tau, rho))).toBeLessThan(0.5);
    }
  });

  it("should show the real Artificial Analysis chart when frozen at t3-aa", () => {
    renderAt(T3.aa.at, <Tip03EffortSegment />);
    expect(screen.getByRole("img", { name: AA_SHOT.alt })).toBeVisible();
  });

  it("should link the chart's source to Artificial Analysis when frozen at t3-aa", () => {
    renderAt(T3.aa.at, <Tip03EffortSegment />);
    const link = screen.getByRole("link");
    expect(link).toBeVisible();
    expect(link).toHaveAttribute("href", LINKS.aa);
  });

  it("should take at least 0.35 seconds to clear the plate and the completion line", () => {
    const end = T3.aa.holdEnd;
    expect(foldAt(end + 0.35, end).opacity).toBeGreaterThan(0);
    expect(foldAt(end + 0.45, end).opacity).toBe(0);
    expect(lineLift(end + 1.2, end + 0.88, end + 1.3).opacity).toBeGreaterThan(0);
  });
});
