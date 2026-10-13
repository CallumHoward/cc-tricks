import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { LINKS, scriptFor } from "#/talk/script";

import { foldAt, lineLift } from "./bracket";
import { splitCallout } from "./chart-plate";
import { glyphAt, needleSeat } from "./dial-plate";
import { BOT_ARC_AT, FRONTIER, OPUS_TARGETS, T3 } from "./timing";
import { arcAt, pointAlong, typedCount } from "./tracks";
import Tip03EffortSegment, { frontierArc } from "./view";

describe("tip 3 effort", () => {
  it("should type whole characters and never past the end", () => {
    expect(typedCount(1, 1, 10, 5)).toBe(0);
    expect(typedCount(1.25, 1, 10, 5)).toBe(2);
    expect(typedCount(9, 1, 10, 5)).toBe(5);
  });

  it("should walk a polyline by arc length", () => {
    const line = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(pointAlong(line, 15)).toEqual({ x: 10, y: 5 });
    expect(arcAt(line, 1, 0.5)).toBe(15);
  });

  it("should creep the dial needle no faster than 3 degrees per second in the hold", () => {
    const degPerSec = ((needleSeat(T3.lastGen.holdEnd) - needleSeat(T3.lastGen.at)) * 35) / 2.5;
    expect(degPerSec).toBeGreaterThan(0);
    expect(degPerSec).toBeLessThanOrEqual(3);
  });

  it("should park the bot between Opus high and xhigh at the stop", () => {
    expect(frontierArc(T3.aa.at)).toBeCloseTo(BOT_ARC_AT, 6);
    expect(pointAlong(FRONTIER, BOT_ARC_AT).x).toBeGreaterThan(OPUS_TARGETS[2]?.x ?? 0);
    expect(pointAlong(FRONTIER, BOT_ARC_AT).x).toBeLessThan(OPUS_TARGETS[3]?.x ?? 0);
  });

  it("should split callouts into the claim and its comparison", () => {
    expect(splitCallout("Opus 5.5 high 54 · $1.82 beats Sonnet 5.5 xhigh")).toEqual([
      "Opus 5.5 high 54 · $1.82",
      "beats Sonnet 5.5 xhigh",
    ]);
  });

  it("should label the dial with every effort level when frozen at t3-then", () => {
    renderAt(T3.lastGen.at, <Tip03EffortSegment />);
    for (const label of scriptFor("t3-then").ui) expect(screen.getByLabelText(label)).toBeVisible();
  });

  it("should keep the seated glyphs turning on ambient time while the story is held", () => {
    const at = T3.lastGen.at;
    expect(glyphAt(2, at, at + 1).rotate).not.toBe(glyphAt(2, at, at).rotate);
  });

  it("should key the chart's models instead of an empty readout when frozen at t3-aa", () => {
    renderAt(T3.aa.at, <Tip03EffortSegment />);
    expect(screen.getByText("GPT-6 Astra (max)")).toBeVisible();
    expect(screen.queryByText("Pick a point")).toBeNull();
    expect(screen.getByRole("region", { name: "Effort picker" })).toBeVisible();
  });

  it("should link the chart's source to Artificial Analysis when frozen at t3-aa", () => {
    renderAt(T3.aa.at, <Tip03EffortSegment />);
    const link = screen.getByRole("link", { name: /Artificial Analysis/ });
    expect(link).toHaveAttribute("href", LINKS.aa);
  });

  it("should take at least 0.35 seconds to clear the plate and the completion line", () => {
    const end = T3.aa.holdEnd;
    expect(foldAt(end + 0.35, end).opacity).toBeGreaterThan(0);
    expect(foldAt(end + 0.45, end).opacity).toBe(0);
    expect(lineLift(end + 1.2, end + 0.88, end + 1.3).opacity).toBeGreaterThan(0);
  });
});
