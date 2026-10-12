import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";

import AfterwordSegment from "./view";

describe("AfterwordSegment", () => {
  it("should show the weekly bars and the typed caption at the limits stop", () => {
    renderAt(272, <AfterwordSegment />);
    expect(screen.getByText("All models")).toBeVisible();
    expect(screen.getByText("95% used")).toBeVisible();
    expect(screen.getByText("Opus")).toBeVisible();
    expect(screen.getByTestId("sightings-poster")).not.toBeVisible();
  });

  it("should pin the sightings poster at the wanted stop", () => {
    renderAt(277, <AfterwordSegment />);
    expect(screen.getByTestId("sightings-poster")).toBeVisible();
    expect(screen.getByText("SIGHTINGS WANTED")).toBeVisible();
    expect(screen.getByText("quota.")).toBeVisible();
    expect(screen.getByText("Opus")).not.toBeVisible();
  });
});
