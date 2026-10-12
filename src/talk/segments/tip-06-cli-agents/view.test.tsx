import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { scriptFor } from "#/talk/script";

import { renderAt } from "./test-stage";
import Tip06CliAgentsSegment, { KIRO_LINES, OTHER_LINES } from "./view";

describe("tip 6 segment", () => {
  it("should show the kiro command and both labels at t6-kiro", () => {
    renderAt(182.5, <Tip06CliAgentsSegment />);
    for (const line of KIRO_LINES) expect(screen.getByText(line.trim())).toBeVisible();
    for (const label of scriptFor("t6-kiro").labels) expect(screen.getByText(label)).toBeVisible();
  });

  it("should show all three other CLI commands at t6-others", () => {
    renderAt(188, <Tip06CliAgentsSegment />);
    for (const line of OTHER_LINES.flat()) expect(screen.getByText(line.trim())).toBeVisible();
  });

  it("should hide the plate outside its window", () => {
    renderAt(176, <Tip06CliAgentsSegment />);
    expect(screen.getByText((KIRO_LINES[0] ?? "").trim())).not.toBeVisible();
  });
});
