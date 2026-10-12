import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Clock } from "#/engine/clock/clock";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";

import OutroSegment from "./view";

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
      <OutroSegment />
    </StageProvider>,
  );
  stage.start();
  act(() => pending?.());
}

describe("OutroSegment", () => {
  it("should set the thesis with its italic phrase at the thesis stop", () => {
    renderAt(285.5);
    expect(screen.getByText("context")).toBeVisible();
    expect(screen.getByText("management.")).toBeVisible();
  });

  it("should show the shownotes QR and the references at the last stop", () => {
    renderAt(293.5);
    expect(
      screen.getByTitle("QR code linking to http://localhost:3000/shownotes"),
    ).toBeInTheDocument();
    expect(screen.getByText("Orchestrating Parallel Agents")).toBeVisible();
    expect(screen.getByText("Shownotes,")).toBeVisible();
  });
});
