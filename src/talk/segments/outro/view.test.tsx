import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { NOTION_SHOWNOTES } from "#/talk/shownotes-url";

import OutroSegment from "./view";

describe("OutroSegment", () => {
  it("should show the bot without the thesis sentence or the link at the thesis stop", () => {
    renderAt(285.5, <OutroSegment />);
    expect(screen.getByRole("img", { name: "the bot" })).toBeVisible();
    expect(screen.queryByText(/context management/i)).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("should link the label beside the QR to the show notes at the last stop", () => {
    renderAt(293.5, <OutroSegment />);
    expect(screen.getByTitle(`QR code linking to ${NOTION_SHOWNOTES}`)).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toBeVisible();
    expect(link).toHaveAttribute("href", NOTION_SHOWNOTES);
    expect(link).toHaveAttribute("target", "_blank");
  });
});
