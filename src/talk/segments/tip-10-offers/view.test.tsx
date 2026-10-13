import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";

import { T10 } from "./tracks";
import Tip10OffersSegment from "./view";

describe("tip 10 view", () => {
  it("should show the real usage screenshot at the resets stop", () => {
    renderAt(T10.resetsAt, <Tip10OffersSegment />);
    expect(screen.getByRole("img", { name: /Usage: Full reset/ })).toBeVisible();
  });

  it("should link the highlighted reset row to the limit reset article", () => {
    renderAt(T10.resetsAt, <Tip10OffersSegment />);
    expect(screen.getByRole("link", { name: "Full reset · Reset for free" })).toHaveAttribute(
      "href",
      "https://support.claude.com/en/articles/17007452-what-is-a-limit-reset",
    );
  });

  it("should leave the spoken prose and the community stamp off the resets stop", () => {
    renderAt(T10.resetsAt, <Tip10OffersSegment />);
    expect(screen.queryByText("COMMUNITY TERMS")).toBeNull();
    expect(screen.queryByText("Occasional weekly limit resets")).toBeNull();
    expect(screen.queryByText("Banked:")).toBeNull();
  });

  it("should show every offer ticket with both stamps at the offers stop", () => {
    renderAt(T10.offersAt, <Tip10OffersSegment />);
    expect(screen.getByText("Full reset")).toBeVisible();
    expect(screen.getByText("Monthly API credits")).toBeVisible();
    expect(screen.getByText("Cloud sessions credit")).toBeVisible();
    expect(screen.getByText("Artifact usage promotion")).toBeVisible();
    expect(screen.getByText("NOT CLAUDE CODE")).toBeVisible();
    expect(screen.getByText("CLOSED")).toBeVisible();
    expect(screen.getByText("Ends Friday 16 Oct, 5:59 PM AEDT")).toBeVisible();
    expect(screen.queryByRole("img", { name: /Usage: Full reset/ })).toBeNull();
  });

  it("should link each offer to its show notes page", () => {
    renderAt(T10.offersAt, <Tip10OffersSegment />);
    expect(screen.getByRole("link", { name: "Monthly API credits" })).toHaveAttribute(
      "href",
      "https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans",
    );
    expect(screen.getByRole("link", { name: "Artifact usage promotion" })).toHaveAttribute(
      "href",
      "https://support.claude.com/en/articles/17274727-artifact-usage-promotion",
    );
  });

  it("should trim the long ticket rows that the speaker covers", () => {
    renderAt(T10.offersAt, <Tip10OffersSegment />);
    expect(screen.queryByText("Pooled across the org, capped at $500 a month")).toBeNull();
    expect(screen.queryByText("Claude and Cowork · not Claude Code · not weekly")).toBeNull();
  });
});
