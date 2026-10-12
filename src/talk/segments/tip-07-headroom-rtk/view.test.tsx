import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { scriptFor } from "#/talk/script";
import { renderAt } from "#/talk/segments/tip-06-cli-agents/test-stage";

import Tip07HeadroomRtkSegment, { HEADROOM_LINES, STATS } from "./view";

describe("tip 7 segment", () => {
  it("should show the re-run rows and their trimmed output at t7-rtk", () => {
    renderAt(196.5, <Tip07HeadroomRtkSegment />);
    expect(screen.getAllByText("+17 more")).toHaveLength(3);
    expect(screen.getByText("(git status)")).toBeVisible();
  });

  it("should show the command, foot, stats and stamp at t7-headroom", () => {
    renderAt(205, <Tip07HeadroomRtkSegment />);
    const copy = scriptFor("t7-headroom");
    for (const line of HEADROOM_LINES) expect(screen.getByText(line)).toBeVisible();
    expect(screen.getByText(copy.footnotes[0] ?? "")).toBeVisible();
    for (const stat of STATS) expect(screen.getByText(stat.value)).toBeVisible();
    expect(screen.getByText(copy.stamps[0] ?? "")).toBeVisible();
  });
});
