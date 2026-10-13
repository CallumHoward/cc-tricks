import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { scriptFor } from "#/talk/script";
import { getCode } from "#/talk/segments/shared/test-utils";

import Tip06CliAgentsSegment, { KIRO_LINES, OTHER_LINES } from "./view";

describe("tip 6 segment", () => {
  it("should show the kiro command without the quota labels at t6-kiro", () => {
    renderAt(182.5, <Tip06CliAgentsSegment />, 1);
    for (const line of KIRO_LINES) expect(getCode(line)).toBeVisible();
    for (const label of scriptFor("t6-kiro").labels) expect(screen.queryByText(label)).toBeNull();
  });

  it("should show all three other CLI commands at t6-others", () => {
    renderAt(188, <Tip06CliAgentsSegment />, 1);
    for (const line of OTHER_LINES.flat()) expect(getCode(line)).toBeVisible();
  });

  it("should highlight each CLI name as the command in its pane", () => {
    renderAt(188, <Tip06CliAgentsSegment />, 1);
    for (const [first = ""] of OTHER_LINES) {
      const name = first.split(" ")[0] ?? "";
      // The title names the CLIs too, so the pane's copy is the last match
      expect(screen.getAllByText(name).at(-1)).toHaveClass("hl-command");
    }
  });

  it("should clear the kiro command before the other CLIs take the stage", () => {
    renderAt(188, <Tip06CliAgentsSegment />, 1);
    expect(getCode(KIRO_LINES[0] ?? "")).not.toBeVisible();
  });

  it("should link /prompt-master to its repo at t6-others", () => {
    renderAt(188, <Tip06CliAgentsSegment />, 1);
    expect(screen.getByRole("link", { name: "/prompt-master" })).toHaveAttribute(
      "href",
      "https://github.com/nidhinjs/prompt-master",
    );
  });

  it("should hide the plate outside its window", () => {
    renderAt(176, <Tip06CliAgentsSegment />, 1);
    expect(getCode(KIRO_LINES[0] ?? "")).not.toBeVisible();
  });
});
