import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { LINKS, scriptFor } from "#/talk/script";

import { answerBar, LAND, LAYA_NAME, LAYA_SHOT } from "./laya-plate";
import { flickerRect } from "./system-one";
import { chipsWritten, cursorAt, RINGED, stepAt, TARGETS, TB } from "./timing";
import BonusLayaSegment from "./view";

describe("bonus laya", () => {
  it("should write one token chip per 0.4 seconds in the hold", () => {
    expect(chipsWritten(TB.one.at + 0.8) - chipsWritten(TB.one.at)).toBe(2);
  });

  it("should glide the cursor at most 30 px per second in the hold", () => {
    const a = cursorAt(TB.browser.at);
    const b = cursorAt(TB.browser.holdEnd);
    const speed = Math.hypot(b.x - a.x, b.y - a.y) / (TB.browser.holdEnd - TB.browser.at);
    expect(speed).toBeLessThanOrEqual(30);
  });

  it("should only ring the targets the cursor has reached", () => {
    for (let k = 0; k < RINGED; k++) expect(cursorAt(stepAt(k))).toEqual(TARGETS[k]);
    expect(cursorAt(TB.browser.holdEnd)).not.toEqual(TARGETS[RINGED]);
  });

  it("should land each flicker bar on its answer bar in the Laya window", () => {
    for (let i = 0; i < 4; i++) {
      const r = flickerRect(i, LAND, 0);
      const bar = answerBar(i);
      expect([r.x, r.y + r.h / 2, r.w]).toEqual([bar.x, bar.y, bar.w]);
    }
  });

  it("should show the real book cover when frozen at b-system-one", () => {
    renderAt(TB.one.at, <BonusLayaSegment />);
    expect(screen.getByRole("img", { name: /Thinking, Fast and Slow/ })).toBeVisible();
    expect(screen.getByText(scriptFor("b-system-one").labels[0] ?? "")).toBeVisible();
  });

  it("should show the playground and link laya-ultrafast when frozen at b-laya", () => {
    renderAt(TB.laya.at, <BonusLayaSegment />);
    expect(screen.getByRole("img", { name: LAYA_SHOT.alt })).toHaveAttribute("src", LAYA_SHOT.src);
    expect(screen.getByRole("link", { name: LAYA_NAME })).toHaveAttribute("href", LINKS.laya);
  });
});
