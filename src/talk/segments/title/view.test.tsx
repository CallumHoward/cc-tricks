import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Clock } from "#/engine/clock/clock";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";
import ForewordSegment from "#/talk/segments/foreword/view";

import TitleSegment from "./view";

function renderAt(tau: number, ui: React.ReactNode) {
  const clock: Clock = {
    sample: () => ({ tau, v: 0 }),
    dispatch: () => {},
    target: 0,
    subscribe: () => () => {},
    plan: () => [],
  };
  let pending: (() => void) | undefined;
  const stage = createStage({
    clock,
    now: () => 0,
    scheduler: {
      request: (cb) => {
        pending = cb;
        return 1;
      },
      cancel: () => {},
    },
  });
  render(<StageProvider stage={stage}>{ui}</StageProvider>);
  stage.start();
  act(() => pending?.());
}

describe("opening segments", () => {
  it("should show the title and byline at the title stop", () => {
    renderAt(12, <TitleSegment />);
    expect(screen.getByText("saving")).toBeVisible();
    expect(screen.getByText("Callum Howard · Checkbox")).toBeVisible();
  });

  it("should show the thesis and zone labels at the spoiler stop", () => {
    renderAt(20, <TitleSegment />);
    expect(screen.getByText("management")).toBeVisible();
    expect(screen.getByText("tool results")).toBeVisible();
  });

  it("should show the chat-box question at the chat-box stop", () => {
    renderAt(28, <ForewordSegment />);
    expect(screen.getByText("box.")).toBeVisible();
    expect(
      screen.getByText("So what sets you apart from the next person off the street?"),
    ).toBeVisible();
  });

  it("should show both answers at the taste stop", () => {
    renderAt(36.5, <ForewordSegment />);
    const line = (text: string) => (_: string, el: Element | null) =>
      el?.tagName === "DIV" && el.textContent === text;
    expect(
      screen.getByText(line("1. Taste: deciding well and knowing what you want")),
    ).toBeVisible();
    expect(
      screen.getByText(line("2. Care for your craft, which comes from being in our world")),
    ).toBeVisible();
    expect(screen.getByText("being")).toBeVisible();
  });

  it("should show the invest headline at the invest stop", () => {
    renderAt(43.5, <ForewordSegment />);
    expect(screen.getByText("trade.")).toBeVisible();
    expect(screen.getByText("Let's")).toBeVisible();
  });
});
