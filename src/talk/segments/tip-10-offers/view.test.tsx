import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/talk/segments/tip-09-suggestions/render-at";

import { T10 } from "./tracks";
import Tip10OffersSegment from "./view";

describe("tip 10 view", () => {
  it("should show the limit reset row and both tickets at the resets stop", () => {
    renderAt(T10.resetsAt, <Tip10OffersSegment />);
    expect(screen.getByRole("button", { name: "Reset for free" })).toBeVisible();
    expect(screen.getByText("Banked:")).toBeVisible();
    expect(screen.getByText("Instant:")).toBeVisible();
    expect(screen.getByText("COMMUNITY TERMS")).toBeVisible();
  });

  it("should show every offer ticket and both stamps at the offers stop", () => {
    renderAt(T10.offersAt, <Tip10OffersSegment />);
    expect(screen.getByText("Monthly API credits")).toBeVisible();
    expect(screen.getByText("Cloud sessions credit")).toBeVisible();
    expect(screen.getByText("Artifact usage promotion")).toBeVisible();
    expect(screen.getByText("NOT CLAUDE CODE")).toBeVisible();
    expect(screen.getByText("CLOSED")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Reset for free" })).toBeNull();
  });
});
