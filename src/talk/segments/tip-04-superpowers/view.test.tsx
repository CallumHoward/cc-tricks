import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { scriptFor } from "#/talk/script";
import { getRise } from "#/talk/segments/shared/test-utils";

import Tip04SuperpowersSegment from "./view";

describe("tip 4 segment", () => {
  it("should show the headline, lines, footnote and both props at t4-superpowers", () => {
    renderAt(156.5, <Tip04SuperpowersSegment />);
    const s = scriptFor("t4-superpowers");
    for (const line of s.lines) expect(getRise(line)).toBeVisible();
    expect(screen.getByText(s.footnotes[0] ?? "")).toBeVisible();
    expect(screen.getByText("superpowers", { selector: ".type-code" })).toBeVisible();
    expect(screen.getByText("fix the typo in README")).toBeVisible();
    expect(getRise(s.headline ?? "")).toBeVisible();
  });
});
