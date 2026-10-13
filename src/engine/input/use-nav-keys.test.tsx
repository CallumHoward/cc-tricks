import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createClock } from "#/engine/clock/clock";
import { createStage, type Stage, type StageCommand } from "#/engine/stage/stage";

import { useNavKeys } from "./use-nav-keys";

describe("useNavKeys", () => {
  const STOPS = [
    { id: "a", at: 1, holdSpan: 1 },
    { id: "b", at: 5, holdSpan: 1 },
    { id: "c", at: 9, holdSpan: 1 },
  ];

  function Surface({ stage }: { stage: Stage }) {
    useNavKeys(stage);
    return (
      <main>
        <p>stage</p>
        <button type="button">widget</button>
      </main>
    );
  }

  function setup() {
    const stage = createStage({
      clock: createClock({ stops: STOPS }),
      stops: STOPS,
      now: () => 0,
      scheduler: { request: () => 0, cancel: () => {} },
    });
    render(<Surface stage={stage} />);
    return { stage, user: userEvent.setup() };
  }

  it("should navigate with the keyboard", async () => {
    const { stage, user } = setup();

    await user.keyboard("{ArrowRight}");
    expect(stage.getSnapshot().stopId).toBe("b");

    await user.keyboard("3{Enter}");
    expect(stage.getSnapshot().stopId).toBe("c");
  });

  it("should not navigate when the stage or a widget is clicked", async () => {
    const { stage, user } = setup();

    await user.click(screen.getByText("stage"));
    await user.click(screen.getByRole("button"));

    expect(stage.getSnapshot().target).toBe(0);
  });

  it("should leave keys to a focused widget", async () => {
    const { stage, user } = setup();
    screen.getByRole("button").focus();

    await user.keyboard("{ArrowRight}");

    expect(stage.getSnapshot().target).toBe(0);
  });

  it("should emit stage commands for non-navigation keys", async () => {
    const { stage, user } = setup();
    const listener = vi.fn<(command: StageCommand) => void>();
    stage.onCommand(listener);

    await user.keyboard("m");

    expect(listener).toHaveBeenCalledWith({ type: "overview" });
  });
});
