import { afterEach, describe, expect, it, vi } from "vitest";

import { createClock } from "#/engine/clock/clock";
import { createStage } from "#/engine/stage/stage";
import type { Stop } from "#/engine/types";

import { bridgeStage, isPresenterMessage } from "./channel";
import { fakePort } from "./fake-port";

describe("presenter channel", () => {
  const STOPS: readonly Stop[] = [
    { id: "a", at: 1, holdSpan: 1 },
    { id: "b", at: 5, holdSpan: 1 },
  ];

  function setup() {
    const stage = createStage({
      clock: createClock({ stops: STOPS }),
      stops: STOPS,
      now: () => 0,
      scheduler: { request: () => 0, cancel: () => {} },
    });
    const fake = fakePort();
    const dispose = bridgeStage(stage, fake.port, ["a", "b"], { now: () => 1234 });
    return { stage, dispose, ...fake };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should accept known messages and reject anything else", () => {
    expect(isPresenterMessage({ type: "nav", action: { type: "next" } })).toBe(true);
    expect(isPresenterMessage({ type: "nav", action: { type: "explode" } })).toBe(false);
    expect(isPresenterMessage({ type: "hello" })).toBe(true);
    expect(isPresenterMessage("next")).toBe(false);
    expect(isPresenterMessage(null)).toBe(false);
  });

  it("should publish the stage state as soon as it connects", () => {
    const { sent } = setup();

    expect(sent.at(-1)).toMatchObject({
      type: "state",
      target: 0,
      stopId: "a",
      startedAt: null,
      stopIds: ["a", "b"],
    });
  });

  it("should navigate the stage and start the talk timer on console nav", () => {
    const { stage, sent, receive } = setup();

    receive({ type: "nav", action: { type: "next" } });

    expect(stage.getSnapshot().stopId).toBe("b");
    expect(sent.at(-1)).toMatchObject({ type: "state", stopId: "b", startedAt: 1234 });
  });

  it("should ignore malformed messages", () => {
    const { stage, receive } = setup();

    receive({ type: "nav", action: "next" });

    expect(stage.getSnapshot().target).toBe(0);
  });

  it("should stop listening once disposed", () => {
    const { dispose, listeners } = setup();

    dispose();

    expect(listeners.size).toBe(0);
  });
});
