import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Clock } from "#/engine/clock/clock";
import { StageProvider } from "#/engine/stage/react";
import { createStage } from "#/engine/stage/stage";
import { scriptFor } from "#/talk/script";

import Tip01SubagentsSegment from "./view";

/** RuleRise sets each word in its own span, so match the whole rise by its joined words. */
const rise = (text: string) =>
  screen.getByText(
    (_, el) =>
      el?.classList.contains("km-rr") === true && el.textContent === text.replace(/\s+/g, ""),
  );

function renderAt(tau: number) {
  const clock: Clock = {
    sample: () => ({ tau, v: 0 }),
    dispatch: () => {},
    target: 0,
    subscribe: () => () => {},
    plan: () => [],
  };
  let pending: (() => void) | undefined;
  const stage = createStage({
    clock,
    now: () => 0,
    scheduler: {
      request: (cb) => {
        pending = cb;
        return 1;
      },
      cancel: () => {},
    },
  });
  render(
    <StageProvider stage={stage}>
      <Tip01SubagentsSegment />
    </StageProvider>,
  );
  stage.start();
  act(() => pending?.());
}

describe("tip 1 segment", () => {
  it("should show the subagents headline, line and label at t1-agents", () => {
    renderAt(52);
    const s = scriptFor("t1-agents");
    expect(rise(s.lines[0] ?? "")).toBeVisible();
    expect(screen.getByText(s.labels[0] ?? "")).toBeVisible();
    expect(rise(s.headline ?? "")).toBeVisible();
  });

  it("should show the agent file and both labels at t1-model-effort", () => {
    renderAt(57.5);
    const s = scriptFor("t1-model-effort");
    expect(screen.getByText(".claude/agents/log-reader.md")).toBeVisible();
    for (const label of s.labels) expect(screen.getByText(label)).toBeVisible();
  });

  it("should show the advisor command and both lines at t1-advisor", () => {
    renderAt(66);
    const s = scriptFor("t1-advisor");
    expect(screen.getByText("/advisor opus")).toBeVisible();
    expect(rise(s.lines[0] ?? "")).toBeVisible();
    expect(screen.getByText(s.lines[1] ?? "")).toBeVisible();
  });
});
