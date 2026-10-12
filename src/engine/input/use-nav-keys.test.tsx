import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
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
    const [el, setEl] = useState<HTMLElement | null>(null);
    useNavKeys(stage, el);
    return (
      <main ref={setEl}>
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

  it("should advance when the stage is clicked but not when a widget is", async () => {
    const { stage, user } = setup();

    await user.click(screen.getByRole("button"));
    expect(stage.getSnapshot().target).toBe(0);

    await user.click(screen.getByText("stage"));
    expect(stage.getSnapshot().target).toBe(1);
  });

  it("should emit stage commands for non-navigation keys", async () => {
    const { stage, user } = setup();
    const listener = vi.fn<(command: StageCommand) => void>();
    stage.onCommand(listener);

    await user.keyboard("m");

    expect(listener).toHaveBeenCalledWith({ type: "mute" });
  });
});
