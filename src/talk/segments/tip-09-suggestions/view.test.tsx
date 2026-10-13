import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { LINKS } from "#/talk/script";

import { T9 } from "./tracks";
import Tip09SuggestionsSegment from "./view";

const SETTING = '"promptSuggestionEnabled": false';

describe("tip 9 view", () => {
  it("should show the setting under the title at the stop", () => {
    renderAt(T9.at, <Tip09SuggestionsSegment />);
    expect(screen.getByText(SETTING)).toBeVisible();
    expect(screen.getByText("Update")).toBeVisible();
  });

  it("should link the settings edit to the settings reference", () => {
    renderAt(T9.at, <Tip09SuggestionsSegment />);
    expect(screen.getByRole("link", { name: /settings\.json/ })).toHaveAttribute(
      "href",
      LINKS.settings,
    );
  });

  it("should leave the spoken prose and the stamp off the stop", () => {
    renderAt(T9.at, <Tip09SuggestionsSegment />);
    expect(screen.queryByText("ANECDOTAL")).toBeNull();
    expect(screen.queryByText(/per user reports/)).toBeNull();
    expect(screen.queryByText(/call the cost/)).toBeNull();
  });

  it("should render nothing outside its window", () => {
    renderAt(T9.end + 0.5, <Tip09SuggestionsSegment />);
    expect(screen.getByText(SETTING)).not.toBeVisible();
  });
});
