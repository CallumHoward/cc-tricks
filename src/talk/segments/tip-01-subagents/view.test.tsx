import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { LINKS, scriptFor } from "#/talk/script";
import { getRise } from "#/talk/segments/shared/test-utils";

import Tip01SubagentsSegment from "./view";

describe("tip 1 segment", () => {
  it("should show the headline, the real screenshot and the previous talk link at t1-agents", () => {
    renderAt(52, <Tip01SubagentsSegment />);
    expect(getRise(scriptFor("t1-agents").headline ?? "")).toBeVisible();
    expect(screen.getByRole("img", { name: /subagents/ })).toBeVisible();
    expect(screen.getByRole("link")).toHaveAttribute("href", LINKS.previousTalk);
  });

  it("should leave the spoken prose off screen at t1-agents", () => {
    renderAt(52, <Tip01SubagentsSegment />);
    expect(screen.queryByText(scriptFor("t1-agents").lines[0] ?? "")).not.toBeInTheDocument();
  });

  it("should show the agent file without its explanatory labels at t1-model-effort", () => {
    renderAt(57.5, <Tip01SubagentsSegment />);
    const s = scriptFor("t1-model-effort");
    expect(screen.getByText(s.code[0]?.label ?? "")).toBeVisible();
    for (const label of s.labels) expect(screen.queryByText(label)).not.toBeInTheDocument();
  });

  it("should link the advisor command to its docs and leave the prose off screen at t1-advisor", () => {
    renderAt(66, <Tip01SubagentsSegment />);
    const s = scriptFor("t1-advisor");
    const link = screen.getByRole("link");
    expect(link).toBeVisible();
    expect(link).toHaveAttribute("href", s.sources[0]);
    for (const line of s.lines) expect(screen.queryByText(line)).not.toBeInTheDocument();
  });
});
