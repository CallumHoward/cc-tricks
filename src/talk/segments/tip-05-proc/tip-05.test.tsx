import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { scriptFor } from "#/talk/script";
import { renderAt } from "#/talk/segments/tip-03-effort/render-at";

import { CARD, cardCopy } from "./routines-plate";
import { HORIZON, minuteToX, RULER_BOX, sunMinute, T5 } from "./timing";
import Tip05ProcSegment from "./view";

describe("tip 5 proc", () => {
  it("should stop the sun on each routine ping", () => {
    expect(sunMinute(168.8)).toBe(640);
    expect(sunMinute(169.2)).toBe(950);
  });

  it("should arc the sun at most one degree per second in the holds", () => {
    const degPerMin = 180 / (21 * 60 - 5 * 60);
    const rate = (sunMinute(T5.chain.holdEnd) - sunMinute(T5.chain.at)) / 2.5;
    expect(rate * degPerMin).toBeLessThanOrEqual(1);
  });

  it("should map the ruler's ends inside its box", () => {
    expect(minuteToX(5 * 60)).toBe(RULER_BOX.x + 60);
    expect(minuteToX(21 * 60)).toBe(RULER_BOX.x + RULER_BOX.w - 60);
  });

  it("should keep the stacked routine cards above the horizon", () => {
    expect(CARD.y + 3 * CARD.h + 2 * CARD.gap).toBeLessThan(HORIZON);
  });

  it("should take each card's copy from the script triples", () => {
    expect(cardCopy(1)).toMatchObject({
      name: "Good afternoon",
      status: "Active · Daily at 10:40 AM",
    });
  });

  it("should show the routine cards when frozen at t5-routines", () => {
    renderAt(T5.routines.at, <Tip05ProcSegment />);
    expect(screen.getByText("Active · Daily at 5:30 AM")).toBeVisible();
    expect(screen.getByText(scriptFor("t5-routines").lines[0] ?? "")).toBeVisible();
  });

  it("should show the chain labels when frozen at t5-chain", () => {
    renderAt(T5.chain.at, <Tip05ProcSegment />);
    expect(screen.getByText("10:40 ping → resets 15:40")).toBeVisible();
    expect(screen.getByText(scriptFor("t5-chain").footnotes[0] ?? "")).toBeVisible();
  });
});
