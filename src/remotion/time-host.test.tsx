import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createExternalClock } from "#/remotion/external-clock";
import { RemotionTimeHost } from "#/remotion/time-host";

const remotion = vi.hoisted(() => ({
  frame: 0,
  fps: 60,
  delayRender: vi.fn<(label: string) => number>(() => 7),
  continueRender: vi.fn<(handle: number) => void>(),
}));

vi.mock("remotion", () => ({
  useCurrentFrame: () => remotion.frame,
  useVideoConfig: () => ({ fps: remotion.fps }),
  delayRender: remotion.delayRender,
  continueRender: remotion.continueRender,
}));

const stops = [
  { id: "a", at: 1, holdSpan: 1 },
  { id: "b", at: 4, holdSpan: 1 },
];

function setup(props: { tau?: number; tauStart?: number; w?: number } = {}) {
  const clock = createExternalClock(stops);
  const stage = { freeze: vi.fn<(at: { tau: number; w: number }) => void>() };
  const view = render(
    <RemotionTimeHost stage={stage} clock={clock} {...props}>
      <p>scene</p>
    </RemotionTimeHost>,
  );
  return { clock, stage, view };
}

describe("remotion time host", () => {
  beforeEach(() => {
    remotion.frame = 0;
    remotion.delayRender.mockClear();
    remotion.continueRender.mockClear();
    window.__stageReady = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render its children", () => {
    setup();
    expect(screen.getByText("scene")).toBeVisible();
  });

  it("should map the composition frame to story time and freeze the stage there", () => {
    remotion.frame = 270;
    const { clock, stage } = setup({ tauStart: 0.5 });
    expect(stage.freeze).toHaveBeenCalledWith({ tau: 5, w: 5 });
    expect(clock.sample(0)).toEqual({ tau: 5, v: 1 });
    expect(clock.target).toBe(1);
  });

  it("should freeze a still at the given tau and wall time", () => {
    remotion.frame = 99;
    const { clock, stage } = setup({ tau: 1.25, w: 30 });
    expect(stage.freeze).toHaveBeenCalledWith({ tau: 1.25, w: 30 });
    expect(clock.sample(0)).toEqual({ tau: 1.25, v: 0 });
  });

  it("should hold the capture until the stage reports ready", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
    setup({ tau: 2 });
    expect(remotion.delayRender).toHaveBeenCalledOnce();
    vi.advanceTimersToNextFrame();
    expect(remotion.continueRender).not.toHaveBeenCalled();
    window.__stageReady = true;
    vi.advanceTimersToNextFrame();
    expect(remotion.continueRender).toHaveBeenCalledExactlyOnceWith(7);
  });

  it("should release the capture hold when unmounted before the stage is ready", () => {
    const { view } = setup({ tau: 2 });
    view.unmount();
    view.unmount();
    expect(remotion.continueRender).toHaveBeenCalledOnce();
  });
});
