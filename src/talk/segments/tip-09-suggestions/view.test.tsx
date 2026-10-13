import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { LINKS } from "#/talk/script";
import { getCode } from "#/talk/segments/shared/test-utils";

import { T9 } from "./tracks";
import Tip09SuggestionsSegment from "./view";

const SETTING = '"promptSuggestionEnabled": false';

describe("tip 9 view", () => {
  it("should show the setting under the title at the stop", () => {
    renderAt(T9.at, <Tip09SuggestionsSegment />);
    expect(getCode(SETTING)).toBeVisible();
    expect(screen.getByText("Update")).toBeVisible();
  });

  it("should syntax-highlight the setting as JSON", () => {
    renderAt(T9.at, <Tip09SuggestionsSegment />);
    expect(screen.getByText('"promptSuggestionEnabled"')).toHaveClass("hl-key");
    expect(screen.getByText("false")).toHaveClass("hl-literal");
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
    expect(getCode(SETTING)).not.toBeVisible();
  });
});
