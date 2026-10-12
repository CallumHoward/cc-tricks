import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Clock } from "#/engine/clock/clock";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";

import { KV, PRICE, STATELESS, SWITCH } from "./timing";
import Tip02CacheSegment from "./view";

vi.mock("#/engine/gl/three-layer", () => ({ useThreeLayer: () => {} }));
vi.mock("#/talk/mascot/stage-mascot", () => ({ StageMascot: () => null }));

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
      <Tip02CacheSegment />
    </StageProvider>,
  );
  stage.start();
  act(() => pending?.());
}

describe("tip 2 segment", () => {
  it("should show the stateless line at its stop", () => {
    renderAt(STATELESS.at);
    expect(
      screen.getByText("Each turn sends the whole chat history and gets one response."),
    ).toBeVisible();
  });

  it("should show the suffix line at the kv stop", () => {
    renderAt(KV.at);
    expect(screen.getByText("Run prefill only on the new suffix.")).toBeVisible();
  });

  it("should show the cache write label at the price stop", () => {
    renderAt(PRICE.at);
    expect(screen.getByText("Cache hit, per million tokens")).toBeVisible();
  });

  it("should show the effort line at the switch stop", () => {
    renderAt(SWITCH.at);
    expect(screen.getByText("/effort → keeps the cache on 5.5 models and Fable 5.1")).toBeVisible();
  });
});
