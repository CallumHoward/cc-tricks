import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SupportStack } from "#/components/support-icons";

import { axe } from "../../vitest-setup";

/** Accessible names of the rendered icons, in DOM order */
function iconTitles() {
  const stack = screen.getByTestId("support-stack");
  return [...stack.querySelectorAll("title")].map((title) => title.textContent);
}

describe("SupportStack", () => {
  it("renders one icon per supported surface", () => {
    render(<SupportStack support={["claude-term", "codex-term"]} />);

    expect(screen.getByTitle("Claude Code terminal")).toBeInTheDocument();
    expect(screen.getByTitle("Codex CLI")).toBeInTheDocument();
    expect(iconTitles()).toHaveLength(2);
  });

  it("omits unsupported surfaces", () => {
    render(<SupportStack support={["claude-term", "claude-app"]} />);

    expect(screen.queryByTitle("Codex CLI")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Codex desktop")).not.toBeInTheDocument();
  });

  it("keeps a fixed order regardless of the order given", () => {
    render(<SupportStack support={["codex-app", "claude-term"]} />);

    expect(iconTitles()).toEqual(["Claude Code terminal", "Codex desktop"]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <SupportStack support={["claude-term", "claude-app", "codex-term", "codex-app"]} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
