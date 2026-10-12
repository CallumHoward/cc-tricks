import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { NOTION_SHOWNOTES } from "#/talk/shownotes-url";

import OutroSegment from "./view";

describe("OutroSegment", () => {
  it("should set the thesis with its italic phrase at the thesis stop", () => {
    renderAt(285.5, <OutroSegment />);
    expect(screen.getByText("context")).toBeVisible();
    expect(screen.getByText("management.")).toBeVisible();
  });

  it("should show the shownotes QR and the references at the last stop", () => {
    renderAt(293.5, <OutroSegment />);
    expect(screen.getByTitle(`QR code linking to ${NOTION_SHOWNOTES}`)).toBeInTheDocument();
    expect(screen.getByText("Orchestrating Parallel Agents")).toBeVisible();
    expect(screen.getByText("Shownotes,")).toBeVisible();
  });
});
