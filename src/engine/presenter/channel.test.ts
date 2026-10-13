import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";

import { createClock } from "#/engine/clock/clock";
import { useNavKeys } from "#/engine/input/use-nav-keys";
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

  /** Keys reaching the stage window's own bubbling keydown handlers, as useNavKeys listens. */
  function stageKeys() {
    const keys: string[] = [];
    const onKey = (event: KeyboardEvent) => keys.push(event.key);
    window.addEventListener("keydown", onKey);
    onTestFinished(() => window.removeEventListener("keydown", onKey));
    return keys;
  }

  it("should accept known messages and reject anything else", () => {
    expect(isPresenterMessage({ type: "nav", action: { type: "next" } })).toBe(true);
    expect(isPresenterMessage({ type: "nav", action: { type: "explode" } })).toBe(false);
    expect(isPresenterMessage({ type: "hello" })).toBe(true);
    expect(isPresenterMessage({ type: "key", key: "m" })).toBe(true);
    expect(isPresenterMessage({ type: "key", key: 3 })).toBe(false);
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

  it("should replay console keys on the stage window and start the timer on navigation keys", () => {
    const { sent, receive } = setup();
    const keys = stageKeys();

    receive({ type: "key", key: "b" });
    const afterBlackout = sent.at(-1);
    receive({ type: "key", key: "ArrowRight" });

    expect(keys).toEqual(["b", "ArrowRight"]);
    expect(afterBlackout).toMatchObject({ type: "state", startedAt: null });
    expect(sent.at(-1)).toMatchObject({ type: "state", startedAt: 1234 });
  });

  it("should navigate the stage through its own key handling when the console forwards a key", () => {
    const { stage, receive } = setup();
    renderHook(() => useNavKeys(stage));

    receive({ type: "key", key: "ArrowRight" });

    expect(stage.getSnapshot().stopId).toBe("b");
  });

  it("should ignore malformed key messages", () => {
    const { receive } = setup();
    const keys = stageKeys();

    receive({ type: "key", key: 3 });
    receive({ type: "key" });

    expect(keys).toEqual([]);
  });
});
