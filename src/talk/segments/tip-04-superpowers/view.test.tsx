import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderAt } from "#/engine/stage/render-at";
import { LINKS, scriptFor } from "#/talk/script";
import { getRise } from "#/talk/segments/shared/test-utils";

import Tip04SuperpowersSegment from "./view";

describe("tip 4 segment", () => {
  it("should show the headline and link the hammer to superpowers at t4-superpowers", () => {
    renderAt(156.5, <Tip04SuperpowersSegment />);
    expect(getRise(scriptFor("t4-superpowers").headline ?? "")).toBeVisible();
    const link = screen.getByRole("link");
    expect(link).toBeVisible();
    expect(link).toHaveAttribute("href", LINKS.superpowers);
  });

  it("should leave the spoken lines and footnote off screen at t4-superpowers", () => {
    renderAt(156.5, <Tip04SuperpowersSegment />);
    const s = scriptFor("t4-superpowers");
    for (const text of [...s.lines, ...s.footnotes]) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  });
});
