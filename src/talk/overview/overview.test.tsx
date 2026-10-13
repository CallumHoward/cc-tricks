import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createClock } from "#/engine/clock/clock";
import { useNavKeys } from "#/engine/input/use-nav-keys";
import { StageProvider } from "#/engine/stage/react";
import { createStage, type Stage } from "#/engine/stage/stage";

import { Overview } from "./overview";

const STOPS = Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, at: 2 + i * 6, holdSpan: 2 }));
const TITLES = STOPS.map(({ id }) => ({ id, title: `Stop ${id}` }));

function Keys({ stage }: { stage: Stage }) {
  useNavKeys(stage);
  return null;
}

function setup() {
  let t = 0;
  let queue: (() => void)[] = [];
  const stage = createStage({
    clock: createClock({ stops: STOPS }),
    stops: STOPS,
    now: () => t,
    scheduler: {
      request: (cb) => queue.push(cb),
      cancel: () => {
        queue = [];
      },
    },
  });
  render(
    <StageProvider stage={stage}>
      <Keys stage={stage} />
      <Overview stops={TITLES}>
        <p>live stage</p>
      </Overview>
    </StageProvider>,
  );
  act(() => stage.start());
  const advance = (seconds: number) =>
    act(() => {
      for (let i = 0; i < Math.round(seconds * 60); i++) {
        t += 1 / 60;
        const run = queue;
        queue = [];
        for (const cb of run) cb();
      }
    });
  return { stage, advance, user: userEvent.setup() };
}

describe("Overview", () => {
  it("should open on M with the live stop marked as current", async () => {
    const { user } = setup();

    await user.keyboard("m");

    const cells = within(screen.getByRole("dialog")).getAllByRole("button");
    expect(cells).toHaveLength(STOPS.length);
    expect(cells[0]).toHaveAttribute("aria-current", "step");
  });

  it("should move the selection with the arrows and cut to it on Enter", async () => {
    const { stage, user } = setup();
    await user.keyboard("o");

    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(stage.getSnapshot().target).toBe(0);
    await user.keyboard("{Enter}");

    expect(stage.getSnapshot().target).toBe(2);
    expect(stage.clock.sample(stage.frame().w).tau).toBeCloseTo(STOPS[2]?.at ?? NaN, 1);
  });

  it("should cut to a stop when its cell is clicked", async () => {
    const { stage, user } = setup();
    await user.keyboard("m");

    await user.click(within(screen.getByRole("dialog")).getAllByRole("button")[5] as HTMLElement);

    expect(stage.getSnapshot().target).toBe(5);
  });

  it("should close on Escape without navigating and give the keys back to the stage", async () => {
    const { stage, advance, user } = setup();
    await user.keyboard("m");
    await user.keyboard("{ArrowRight}{Escape}");
    advance(2);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(stage.getSnapshot().target).toBe(0);

    await user.keyboard("{ArrowRight}");
    expect(stage.getSnapshot().target).toBe(1);
  });
});
