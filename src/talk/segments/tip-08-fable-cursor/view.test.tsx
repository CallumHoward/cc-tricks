import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { scriptFor } from "#/talk/script";

import Tip08FableCursorSegment from "./view";

describe("tip 8 segment", () => {
  it("should show both column heads at t8-cache", () => {
    renderAt(214, <Tip08FableCursorSegment />, 1);
    for (const head of scriptFor("t8-cache").tables[0]?.head ?? []) {
      expect(screen.getAllByText(head)[0]).toBeVisible();
    }
  });

  it("should show the stamp and the price foot at t8-18x", () => {
    renderAt(219.5, <Tip08FableCursorSegment />, 1);
    const copy = scriptFor("t8-18x");
    expect(screen.getByText(copy.stamps[0] ?? "")).toBeVisible();
    expect(screen.getByText(copy.footnotes[0] ?? "")).toBeVisible();
  });
});
