import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";

import AfterwordSegment from "./view";

describe("AfterwordSegment", () => {
  it("should show the real weekly limits screenshot at the limits stop", () => {
    renderAt(272, <AfterwordSegment />);
    const shot = screen.getByRole("img", { name: /weekly limits/i });
    expect(shot).toBeVisible();
    expect(shot).toHaveAttribute("src", "/talk/refs/weekly-limits.webp");
  });

  it("should keep the screenshot on screen without a poster at the wanted stop", () => {
    renderAt(277, <AfterwordSegment />);
    expect(screen.getByRole("img", { name: /weekly limits/i })).toBeVisible();
    expect(screen.queryByTestId("sightings-poster")).toBeNull();
  });
});
