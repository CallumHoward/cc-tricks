import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { scriptFor } from "#/talk/script";
import { getRise } from "#/talk/segments/shared/test-utils";

import Tip01SubagentsSegment from "./view";

describe("tip 1 segment", () => {
  it("should show the subagents headline, line and label at t1-agents", () => {
    renderAt(52, <Tip01SubagentsSegment />);
    const s = scriptFor("t1-agents");
    expect(getRise(s.lines[0] ?? "")).toBeVisible();
    expect(screen.getByText(s.labels[0] ?? "")).toBeVisible();
    expect(getRise(s.headline ?? "")).toBeVisible();
  });

  it("should show the agent file and both labels at t1-model-effort", () => {
    renderAt(57.5, <Tip01SubagentsSegment />);
    const s = scriptFor("t1-model-effort");
    expect(screen.getByText(".claude/agents/log-reader.md")).toBeVisible();
    for (const label of s.labels) expect(screen.getByText(label)).toBeVisible();
  });

  it("should show the advisor command and both lines at t1-advisor", () => {
    renderAt(66, <Tip01SubagentsSegment />);
    const s = scriptFor("t1-advisor");
    expect(screen.getByText("/advisor opus")).toBeVisible();
    expect(getRise(s.lines[0] ?? "")).toBeVisible();
    expect(screen.getByText(s.lines[1] ?? "")).toBeVisible();
  });
});
