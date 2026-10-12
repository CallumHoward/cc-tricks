import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "./render-at";
import { T9 } from "./tracks";
import Tip09SuggestionsSegment from "./view";

describe("tip 9 view", () => {
  it("should show the setting, both lines and the footnote at the stop", () => {
    renderAt(T9.at, <Tip09SuggestionsSegment />);
    expect(screen.getByText('"promptSuggestionEnabled": false')).toBeVisible();
    expect(screen.getByText("Update")).toBeVisible();
    expect(screen.getByText("ANECDOTAL")).toBeVisible();
    expect(screen.getByText("reports")).toBeVisible();
  });

  it("should render nothing outside its window", () => {
    renderAt(T9.end + 0.5, <Tip09SuggestionsSegment />);
    expect(screen.getByText("ANECDOTAL")).not.toBeVisible();
  });
});
