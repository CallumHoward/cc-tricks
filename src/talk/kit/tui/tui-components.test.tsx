import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import type { Clock } from "#/engine/clock/clock";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";

import { SpinnerLine } from "./spinner-line";

function renderAt(tau: number, v: number, ui: ReactNode) {
  const clock: Clock = {
    sample: () => ({ tau, v }),
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

describe("tui components", () => {
  it("should show the verb while playing forward", () => {
    renderAt(5, 1, <SpinnerLine verb="Orchestrating" at={0} />);
    expect(screen.getByText("Orchestrating…")).toBeVisible();
  });

  it("should read Moonwalking while rewinding", () => {
    renderAt(5, -2.5, <SpinnerLine verb="Orchestrating" at={0} />);
    expect(screen.getByText("Moonwalking…")).toBeVisible();
  });

  it("should label the token counter with its formatted value", () => {
    renderAt(5, 1, <SpinnerLine verb="Onioning" at={0} tokens={97_300} />);
    expect(screen.getByLabelText("97.3k")).toBeVisible();
  });
});
