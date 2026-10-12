import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { createClock } from "#/engine/clock/clock";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";

import { IdleTtl } from "./idle-ttl";
import { PingChain } from "./ping-chain";
import { ResetButton } from "./reset-button";

function setup(ui: ReactNode) {
  let now = 0;
  const pending: (() => void)[] = [];
  const stage = createStage({
    clock: createClock({ stops: [{ id: "a", at: 1, holdSpan: 1 }] }),
    now: () => now,
    scheduler: { request: (cb) => pending.push(cb), cancel: () => {} },
  });
  stage.start();
  const tick = (seconds: number) =>
    act(() => {
      now += seconds;
      for (const cb of pending.splice(0)) cb();
    });
  render(<StageProvider stage={stage}>{ui}</StageProvider>);
  return { tick };
}

describe("widgets", () => {
  it("should answer the reset button on wall time", async () => {
    const { tick } = setup(<ResetButton />);
    await userEvent.click(screen.getByRole("button", { name: "Reset for free" }));
    tick(0.1);
    tick(2);
    expect(screen.getByText("not during a talk")).toBeVisible();
  });

  it("should let the subagent setting outrank an agent pin on the ladder", async () => {
    setup(<IdleTtl />);
    const rungs = screen.getAllByRole("button");
    await userEvent.click(rungs[2]!);
    await userEvent.click(rungs[1]!);
    expect(rungs[1]).toHaveAttribute("data-winner");
    await userEvent.click(rungs[0]!);
    expect(rungs[0]).toHaveAttribute("data-winner");
    expect(rungs[1]).not.toHaveAttribute("data-winner");
  });

  it("should keep stage navigation keys away from a widget", () => {
    setup(<ResetButton />);
    expect(screen.getByRole("region", { name: "Limit reset" })).toHaveAttribute("data-interactive");
  });

  it("should fall back to the first message's window when routines are switched off", async () => {
    setup(<PingChain start={0} />);
    const toggle = screen.getByRole("button", { name: "Routines on" });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/^No pings: your first message at 09:00/)).toBeVisible();
    expect(screen.getByText("09:00 message → resets 14:00")).toBeVisible();
  });
});
