import { afterEach, describe, expect, it, vi } from "vitest";

import { createClock } from "#/engine/clock/clock";
import type { Frame, Stop } from "#/engine/types";

import { createStage, inMountWindow, mountedAt, PRIORITY, type StageCommand } from "./stage";

describe("createStage", () => {
  const STOPS: readonly Stop[] = [
    { id: "a", at: 2, holdSpan: 2 },
    { id: "b", at: 9, holdSpan: 2 },
    { id: "c", at: 16, holdSpan: 2 },
  ];

  function manualScheduler() {
    let queue: (() => void)[] = [];
    return {
      request(cb: () => void) {
        queue.push(cb);
        return queue.length;
      },
      cancel() {
        queue = [];
      },
      flush() {
        const run = queue;
        queue = [];
        for (const cb of run) cb();
      },
    };
  }

  function setup(segments: { id: string; window: { start: number; end: number } }[] = []) {
    let t = 100;
    const scheduler = manualScheduler();
    const clock = createClock({ stops: STOPS });
    const stage = createStage({
      clock,
      stops: STOPS,
      segments,
      now: () => t,
      scheduler,
      fontsReady: () => Promise.resolve(),
    });
    return {
      stage,
      scheduler,
      advance: (seconds: number) => {
        t += seconds;
        scheduler.flush();
      },
    };
  }

  afterEach(() => {
    window.__stageReady = undefined;
  });

  it("should treat τ within one second of a window as mounted", () => {
    const window = { start: 5, end: 10 };

    expect(inMountWindow(window, 4)).toBe(true);
    expect(inMountWindow(window, 11)).toBe(true);
    expect(inMountWindow(window, 3.9)).toBe(false);
    expect(inMountWindow(window, 11.1)).toBe(false);
  });

  it("should list mounted ids once in registration order", () => {
    const windows = [
      { id: "b", window: { start: 4, end: 8 } },
      { id: "a", window: { start: 0, end: 5 } },
      { id: "b", window: { start: 4, end: 9 } },
      { id: "z", window: { start: 20, end: 30 } },
    ];

    expect(mountedAt(windows, 5)).toEqual(["b", "a"]);
  });

  it("should run frame callbacks in priority order with wall time since start", () => {
    const { stage, advance } = setup();
    const calls: string[] = [];
    stage.onFrame(() => calls.push("audio"), PRIORITY.audio);
    stage.onFrame(() => calls.push("dom"));
    stage.onFrame(() => calls.push("clock"), PRIORITY.clock);

    stage.start();
    advance(0.5);

    expect(calls).toEqual(["clock", "dom", "audio"]);
    expect(stage.frame().w).toBeCloseTo(0.5);
  });

  it("should keep ticking when a callback throws", () => {
    const { stage, advance } = setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const seen: number[] = [];
    stage.onFrame(() => {
      throw new Error("boom");
    });
    stage.onFrame((frame) => seen.push(frame.w));

    stage.start();
    advance(0.1);
    advance(0.1);

    expect(seen).toHaveLength(2);
  });

  it("should stop calling a callback after it unsubscribes", () => {
    const { stage, advance } = setup();
    const cb = vi.fn<(frame: Frame) => void>();
    const off = stage.onFrame(cb);

    stage.start();
    advance(0.1);
    off();
    advance(0.1);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("should report the target stop id after navigation", () => {
    const { stage, advance } = setup();
    const listener = vi.fn<() => void>();
    stage.subscribe(listener);

    stage.start();
    advance(0.1);
    stage.dispatch({ type: "next" });

    expect(stage.getSnapshot()).toMatchObject({ target: 1, stopId: "b" });
    expect(listener).toHaveBeenCalled();
  });

  it("should keep the snapshot identity while nothing coarse changes", () => {
    const { stage, advance } = setup();
    stage.start();
    advance(0.1);
    const before = stage.getSnapshot();

    advance(0.1);

    expect(stage.getSnapshot()).toBe(before);
  });

  it("should mount segments as τ moves into their window", () => {
    const { stage, advance } = setup([
      { id: "a", window: { start: 0, end: 5 } },
      { id: "b", window: { start: 6, end: 12 } },
    ]);
    stage.start();
    advance(0.1);
    expect(stage.getSnapshot().mountedSegments).toEqual(["a"]);

    stage.dispatch({ type: "next" });
    for (let i = 0; i < 200; i++) advance(0.05);

    expect(stage.getSnapshot().mountedSegments).toEqual(["b"]);
    expect(stage.frame().tau).toBeGreaterThan(8);
  });

  it("should include registered segments and drop them on unregister", () => {
    const { stage } = setup();
    const off = stage.registerSegment("late", { start: 1, end: 3 });

    expect(stage.getSnapshot().mountedSegments).toEqual(["late"]);
    off();
    expect(stage.getSnapshot().mountedSegments).toEqual([]);
  });

  it("should render a frozen frame and flag readiness once settled", async () => {
    const { stage, scheduler } = setup();
    const frames: Frame[] = [];
    stage.onFrame((frame) => frames.push(frame));
    window.__stageReady = false;

    stage.freeze({ tau: 7, w: 3 });
    expect(frames[0]).toEqual({ tau: 7, v: 0, w: 3, dt: 0 });
    expect(window.__stageReady).toBe(false);

    for (let i = 0; i < 6; i++) {
      await Promise.resolve();
      scheduler.flush();
      await Promise.resolve();
    }

    expect(window.__stageReady).toBe(true);
    expect(stage.frozen).toBe(true);
  });

  it("should wait for holds before flagging a frozen frame ready", async () => {
    const { stage, scheduler } = setup();
    const release = stage.hold("gpu");

    stage.freeze({ tau: 1, w: 1 });
    for (let i = 0; i < 6; i++) {
      await Promise.resolve();
      scheduler.flush();
    }
    expect(window.__stageReady).toBeUndefined();

    release();
    for (let i = 0; i < 6; i++) {
      await Promise.resolve();
      scheduler.flush();
      await Promise.resolve();
    }
    expect(window.__stageReady).toBe(true);
  });

  it("should ignore navigation while frozen", () => {
    const { stage } = setup();
    stage.freeze({ tau: 1, w: 0 });

    stage.dispatch({ type: "next" });

    expect(stage.getSnapshot().target).toBe(0);
  });

  it("should deliver commands to listeners", () => {
    const { stage } = setup();
    const listener = vi.fn<(command: StageCommand) => void>();
    stage.onCommand(listener);

    stage.emit({ type: "mute" });

    expect(listener).toHaveBeenCalledWith({ type: "mute" });
  });
});
