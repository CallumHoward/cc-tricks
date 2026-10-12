import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EXPRESSION_NAMES } from "./expressions";
import { CharacterSheet } from "./sheet";

describe("CharacterSheet", () => {
  it("should present at least ten expressions drawn by the rig", () => {
    render(<CharacterSheet />);
    expect(EXPRESSION_NAMES.length).toBeGreaterThanOrEqual(10);
    const sheet = within(screen.getByRole("region", { name: "Expressions" }));
    for (const name of EXPRESSION_NAMES) expect(sheet.getByRole("img", { name })).toBeVisible();
  });

  it("should show the four turnaround views", () => {
    render(<CharacterSheet />);
    for (const view of [/^front/, /^¾ · 35/, /^side · 90/, /^back/]) {
      expect(screen.getByRole("img", { name: view })).toBeVisible();
    }
  });
});
