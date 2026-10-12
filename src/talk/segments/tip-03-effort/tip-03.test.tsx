import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { scriptFor } from "#/talk/script";

import { splitCallout } from "./chart-plate";
import { needleSeat } from "./dial-plate";
import { renderAt } from "./render-at";
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

  it("should show the last-gen claim when frozen at t3-then", () => {
    renderAt(T3.lastGen.at, <Tip03EffortSegment />);
    expect(screen.getByText(scriptFor("t3-then").lines[0] ?? "")).toBeVisible();
    expect(screen.getByText(scriptFor("t3-then").stamps[0] ?? "")).toBeVisible();
  });

  it("should show the deadpan footnote when frozen at t3-aa", () => {
    renderAt(T3.aa.at, <Tip03EffortSegment />);
    expect(screen.getByText(scriptFor("t3-aa").footnotes[1] ?? "")).toBeVisible();
    expect(screen.getByRole("region", { name: "Effort picker" })).toBeVisible();
  });
});
