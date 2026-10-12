import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderAt as renderStageAt } from "#/engine/stage/render-at";

import { IDLE, KV, PRICE, STATELESS, SWITCH, TTL } from "./timing";
import Tip02CacheSegment from "./view";

vi.mock("#/engine/gl/three-layer", () => ({ useThreeLayer: () => {} }));
vi.mock("#/talk/mascot/stage-mascot", () => ({ StageMascot: () => null }));

const renderAt = (tau: number) => renderStageAt(tau, <Tip02CacheSegment />);

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

  it("should keep the cold price line on screen at the ttl stop", () => {
    renderAt(TTL.at);
    expect(screen.getByText("Cold is 25–80× the price of warm.")).toBeVisible();
  });

  it("should show why a late check-in costs a re-read at the idle stop", () => {
    renderAt(IDLE.at);
    expect(
      screen.getByText("A check-in after the cache expires re-reads the whole context, uncached."),
    ).toBeVisible();
  });

  it("should show the effort line at the switch stop", () => {
    renderAt(SWITCH.at);
    expect(screen.getByText("/effort → keeps the cache on 5.5 models and Fable 5.1")).toBeVisible();
  });
});
