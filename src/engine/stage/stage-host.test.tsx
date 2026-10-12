import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import type { Stop } from "#/engine/types";

import { StageHost } from "./stage-host";
import { fitScale } from "./viewport";

describe("StageHost", () => {
  const STOPS: readonly Stop[] = [
    { id: "intro", at: 1, holdSpan: 1 },
    { id: "middle", at: 5, holdSpan: 1 },
    { id: "outro", at: 9, holdSpan: 1 },
  ];

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("should fit the logical stage inside the window", () => {
    expect(fitScale(1920, 1080)).toBe(1);
    expect(fitScale(960, 1080)).toBe(0.5);
    expect(fitScale(3840, 1080)).toBe(1);
    expect(fitScale(0, 0)).toBe(1);
  });

  it("should navigate and mirror the target stop in the hash", async () => {
    const user = userEvent.setup();
    render(
      <StageHost stops={STOPS}>
        <p>content</p>
      </StageHost>,
    );
    const stage = screen.getByRole("main", { name: "Talk stage" });
    expect(stage).toHaveAttribute("data-target", "0");

    await user.keyboard("{ArrowRight}");

    expect(stage).toHaveAttribute("data-target", "1");
    expect(window.location.hash).toBe("#middle");
  });

  it("should start at the stop named in the hash", () => {
    window.history.replaceState(null, "", "/#outro");

    render(
      <StageHost stops={STOPS}>
        <p>content</p>
      </StageHost>,
    );

    expect(screen.getByRole("main", { name: "Talk stage" })).toHaveAttribute("data-stop", "outro");
  });

  it("should toggle the blackout with B", async () => {
    const user = userEvent.setup();
    render(
      <StageHost stops={STOPS}>
        <p>content</p>
      </StageHost>,
    );

    await user.keyboard("b");
    expect(screen.getByTestId("blackout")).toBeVisible();

    await user.keyboard(".");
    expect(screen.queryByTestId("blackout")).not.toBeInTheDocument();
  });
});
