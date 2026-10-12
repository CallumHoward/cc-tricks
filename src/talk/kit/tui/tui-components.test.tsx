import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";

import { SpinnerLine } from "./spinner-line";

describe("tui components", () => {
  it("should show the verb while playing forward", () => {
    renderAt(5, <SpinnerLine verb="Orchestrating" at={0} />, 1);
    expect(screen.getByText("Orchestrating…")).toBeVisible();
  });

  it("should read Moonwalking while rewinding", () => {
    renderAt(5, <SpinnerLine verb="Orchestrating" at={0} />, -2.5);
    expect(screen.getByText("Moonwalking…")).toBeVisible();
  });

  it("should label the token counter with its formatted value", () => {
    renderAt(5, <SpinnerLine verb="Onioning" at={0} tokens={97_300} />, 1);
    expect(screen.getByLabelText("97.3k")).toBeVisible();
  });
});
