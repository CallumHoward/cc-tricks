import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { scriptFor } from "#/talk/script";
import { renderAt } from "#/talk/segments/tip-03-effort/render-at";

import { chipsWritten, cursorAt, TB } from "./timing";
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

  it("should show the book when frozen at b-system-one", () => {
    renderAt(TB.one.at, <BonusLayaSegment />);
    expect(screen.getByText("Thinking, Fast and Slow")).toBeVisible();
    expect(screen.getByText(scriptFor("b-system-one").labels[0] ?? "")).toBeVisible();
  });

  it("should show the Laya foot when frozen at b-laya", () => {
    renderAt(TB.laya.at, <BonusLayaSegment />);
    expect(screen.getByText(scriptFor("b-laya").footnotes[0] ?? "")).toBeVisible();
  });

  it("should show the browser lines when frozen at b-browser", () => {
    renderAt(TB.browser.at, <BonusLayaSegment />);
    expect(screen.getByText(scriptFor("b-browser").lines[1] ?? "")).toBeVisible();
  });
});
