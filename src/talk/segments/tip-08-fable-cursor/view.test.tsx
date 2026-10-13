import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { scriptFor } from "#/talk/script";
import { getRise } from "#/talk/segments/shared/test-utils";

import Tip08FableCursorSegment from "./view";

describe("tip 8 segment", () => {
  it("should show both column heads at t8-cache", () => {
    renderAt(214, <Tip08FableCursorSegment />, 1);
    for (const head of scriptFor("t8-cache").tables[0]?.head ?? []) {
      expect(screen.getAllByText(head)[0]).toBeVisible();
    }
  });

  it("should link the Cursor column to Cursor's models and pricing at t8-cache", () => {
    renderAt(214, <Tip08FableCursorSegment />, 1);
    expect(screen.getByRole("link", { name: "Cursor" })).toHaveAttribute(
      "href",
      "https://cursor.com/docs/models-and-pricing",
    );
  });

  it("should show the 18x headline with no stamp or price footnote at t8-18x", () => {
    renderAt(219.5, <Tip08FableCursorSegment />, 1);
    const copy = scriptFor("t8-18x");
    expect(getRise(copy.headline ?? "")).toBeVisible();
    expect(screen.queryByText(copy.stamps[0] ?? "")).toBeNull();
    expect(screen.queryByText(copy.footnotes[0] ?? "")).toBeNull();
  });
});
