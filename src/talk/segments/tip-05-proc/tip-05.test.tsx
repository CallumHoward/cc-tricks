import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { ROUTINES } from "#/talk/data/routines";

import { cardRect, DOCS, glowAt, ROUTINES_SHOT } from "./routines-plate";
import { minuteToX, pinStart, RULER_BOX, sunMinute, T5 } from "./timing";
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

  it("should fold each routine's glow onto its pin as the pin drops", () => {
    ROUTINES.forEach((r, i) => {
      const rect = cardRect(i);
      const drop = T5.chain.pinsAt + i * T5.chain.pinStagger - 1e-3;
      const g = glowAt(i, drop, drop);
      const pin = pinStart(r.at);
      expect(rect.x + rect.w / 2 + g.x).toBeCloseTo(pin.x, 0);
      expect(rect.y + rect.h / 2 + g.y).toBeCloseTo(pin.y, 0);
    });
  });

  it("should show the real Routines screenshot when frozen at t5-routines", () => {
    renderAt(T5.routines.at, <Tip05ProcSegment />);
    expect(screen.getByRole("img", { name: ROUTINES_SHOT.alt })).toHaveAttribute(
      "src",
      ROUTINES_SHOT.src,
    );
  });

  it("should link the Desktop scheduled tasks docs when frozen at t5-routines", () => {
    renderAt(T5.routines.at, <Tip05ProcSegment />);
    expect(screen.getByRole("link", { name: DOCS.label })).toHaveAttribute("href", DOCS.href);
  });

  it("should offer one draggable pin per routine when frozen at t5-chain", () => {
    renderAt(T5.chain.at, <Tip05ProcSegment />);
    const pins = screen.getAllByRole("slider");
    expect(pins.map((p) => Number(p.getAttribute("aria-valuenow")))).toEqual(
      ROUTINES.map((r) => r.at),
    );
  });

  it("should show the chain labels when frozen at t5-chain", () => {
    renderAt(T5.chain.at, <Tip05ProcSegment />);
    expect(screen.getByText("10:40 ping → resets 15:40")).toBeVisible();
  });
});
