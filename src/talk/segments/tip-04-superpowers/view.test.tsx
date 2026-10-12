import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Clock } from "#/engine/clock/clock";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";
import { scriptFor } from "#/talk/script";

import Tip04SuperpowersSegment from "./view";

/** RuleRise sets each word in its own span, so match the whole rise by its joined words. */
const rise = (text: string) =>
  screen.getByText(
    (_, el) =>
      el?.classList.contains("km-rr") === true && el.textContent === text.replace(/\s+/g, ""),
  );

function renderAt(tau: number) {
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
  render(
    <StageProvider stage={stage}>
      <Tip04SuperpowersSegment />
    </StageProvider>,
  );
  stage.start();
  act(() => pending?.());
}

describe("tip 4 segment", () => {
  it("should show the headline, lines, footnote and both props at t4-superpowers", () => {
    renderAt(156.5);
    const s = scriptFor("t4-superpowers");
    for (const line of s.lines) expect(rise(line)).toBeVisible();
    expect(screen.getByText(s.footnotes[0] ?? "")).toBeVisible();
    expect(screen.getByText("superpowers", { selector: ".type-code" })).toBeVisible();
    expect(screen.getByText("fix the typo in README")).toBeVisible();
    expect(rise(s.headline ?? "")).toBeVisible();
  });
});
