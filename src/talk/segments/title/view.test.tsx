import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { LINKS } from "#/talk/script";
import ForewordSegment from "#/talk/segments/foreword/view";

import TitleSegment from "./view";

describe("opening segments", () => {
  it("should show the title and byline at the title stop", () => {
    renderAt(12, <TitleSegment />);
    expect(screen.getByText("saving")).toBeVisible();
    expect(screen.getByText("Callum Howard · Checkbox")).toBeVisible();
  });

  it("should show the zone labels without the thesis at the spoiler stop", () => {
    renderAt(20, <TitleSegment />);
    expect(screen.getByText("tool results")).toBeVisible();
    expect(screen.queryByText("management")).toBeNull();
  });

  it("should show only the chat-box headline at the chat-box stop", () => {
    renderAt(28, <ForewordSegment />);
    expect(screen.getByText("box.")).toBeVisible();
    expect(screen.queryByText(/next person off the street/)).toBeNull();
  });

  it("should show taste and care as single words at the taste stop", () => {
    renderAt(36.5, <ForewordSegment />);
    expect(screen.getByLabelText("Taste")).toBeVisible();
    expect(screen.getByLabelText("Care")).toBeVisible();
    expect(screen.queryByText(/knowing what you want/)).toBeNull();
  });

  it("should show the invest headline without the closing prose at the invest stop", () => {
    renderAt(43.5, <ForewordSegment />);
    expect(screen.getByText("trade.")).toBeVisible();
    expect(screen.queryByText("Let's")).toBeNull();
  });

  it("should link the menu's tools to their show notes repos at the invest stop", () => {
    renderAt(43.5, <ForewordSegment />);
    expect(screen.getByRole("link", { name: "superpowers" })).toHaveAttribute(
      "href",
      LINKS.superpowers,
    );
    expect(screen.getByRole("link", { name: "headroom" })).toHaveAttribute("href", LINKS.headroom);
    expect(screen.getByRole("link", { name: "rtk" })).toHaveAttribute("href", LINKS.rtk);
  });
});
