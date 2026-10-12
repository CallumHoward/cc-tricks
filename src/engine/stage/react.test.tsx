import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Clock } from "#/engine/clock/clock";
import { keys } from "#/engine/motion/track";
import type { Stop } from "#/engine/types";

import { SegmentGate, StageProvider, useStageSnapshot, useTrack } from "./react";
import { createStage } from "./stage";

describe("stage React bindings", () => {
  const STOPS: readonly Stop[] = [
    { id: "a", at: 1, holdSpan: 1 },
    { id: "b", at: 10, holdSpan: 1 },
  ];

  function fixedClock() {
    let tau = 0;
    const listeners = new Set<() => void>();
    const clock: Clock & { set(t: number): void } = {
      sample: () => ({ tau, v: 0 }),
      dispatch: () => {},
      get target() {
        return tau >= STOPS[1].at ? 1 : 0;
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      plan: () => [],
      set(t) {
        tau = t;
        for (const listener of listeners) listener();
      },
    };
    return clock;
  }

  function setup() {
    const clock = fixedClock();
    const stage = createStage({
      clock,
      stops: STOPS,
      scheduler: { request: () => 0, cancel: () => {} },
      fontsReady: () => new Promise(() => {}),
    });
    const seek = (tau: number) =>
      act(() => {
        clock.set(tau);
        stage.freeze({ tau, w: 0 });
      });
    return { stage, seek };
  }

  const fade = { opacity: keys([0, 0], [2, 1]) };

  function Faded() {
    return <p ref={useTrack(fade)}>faded</p>;
  }

  function Target() {
    const { stopId } = useStageSnapshot();
    return <output>{stopId}</output>;
  }

  it("should write the current sample on attach and update it each frame", () => {
    const { stage, seek } = setup();
    render(
      <StageProvider stage={stage}>
        <Faded />
      </StageProvider>,
    );
    expect(screen.getByText("faded").style.opacity).toBe("0");

    seek(1);

    expect(screen.getByText("faded").style.opacity).toBe("0.5");
  });

  it("should mount a segment only near its window", () => {
    const { stage, seek } = setup();
    render(
      <StageProvider stage={stage}>
        <SegmentGate id="late" window={{ start: 5, end: 8 }}>
          <p>late segment</p>
        </SegmentGate>
      </StageProvider>,
    );
    expect(screen.queryByText("late segment")).not.toBeInTheDocument();

    seek(4.5);
    expect(screen.getByText("late segment")).toBeVisible();
    expect(stage.getSnapshot().mountedSegments).toEqual(["late"]);

    seek(9.5);
    expect(screen.queryByText("late segment")).not.toBeInTheDocument();
  });

  it("should re-render snapshot readers when the target stop changes", () => {
    const { stage, seek } = setup();
    render(
      <StageProvider stage={stage}>
        <Target />
      </StageProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("a");

    seek(10);

    expect(screen.getByRole("status")).toHaveTextContent("b");
  });
});
