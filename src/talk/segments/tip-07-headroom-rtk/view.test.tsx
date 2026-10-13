import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { LINKS } from "#/talk/script";

import Tip07HeadroomRtkSegment from "./view";

describe("tip 7 segment", () => {
  it("should show the re-run rows and their trimmed output at t7-rtk", () => {
    renderAt(196.5, <Tip07HeadroomRtkSegment />, 1);
    expect(screen.getAllByText("+17 more")).toHaveLength(3);
    expect(screen.getByText("(git status)")).toBeVisible();
  });

  it("should link the rtk clamp to its repo at t7-rtk", () => {
    renderAt(196.5, <Tip07HeadroomRtkSegment />, 1);
    expect(screen.getByRole("link", { name: "rtk" })).toHaveAttribute("href", LINKS.rtk);
  });

  it("should show the headroom dashboard linked to its repo at t7-headroom", () => {
    renderAt(205, <Tip07HeadroomRtkSegment />, 1);
    expect(screen.getByRole("img", { name: "Headroom dashboard" })).toBeVisible();
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === LINKS.headroom);
    expect(link).toHaveTextContent("headroom");
    expect(link).toBeVisible();
  });

  it("should hide the dashboard once the camera is back in the terminal", () => {
    renderAt(196.5, <Tip07HeadroomRtkSegment />, 1);
    expect(screen.getByRole("img", { name: "Headroom dashboard", hidden: true })).not.toBeVisible();
  });
});
