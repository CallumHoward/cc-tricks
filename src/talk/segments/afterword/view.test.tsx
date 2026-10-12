import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Clock } from "#/engine/clock/clock";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";

import AfterwordSegment from "./view";

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
      <AfterwordSegment />
    </StageProvider>,
  );
  stage.start();
  act(() => pending?.());
}

describe("AfterwordSegment", () => {
  it("should show the weekly bars and the typed caption at the limits stop", () => {
    renderAt(272);
    expect(screen.getByText("All models")).toBeVisible();
    expect(screen.getByText("95% used")).toBeVisible();
    expect(screen.getByText("Opus")).toBeVisible();
    expect(screen.getByTestId("sightings-poster")).not.toBeVisible();
  });

  it("should pin the sightings poster at the wanted stop", () => {
    renderAt(277);
    expect(screen.getByTestId("sightings-poster")).toBeVisible();
    expect(screen.getByText("SIGHTINGS WANTED")).toBeVisible();
    expect(screen.getByText("quota.")).toBeVisible();
    expect(screen.getByText("Opus")).not.toBeVisible();
  });
});
