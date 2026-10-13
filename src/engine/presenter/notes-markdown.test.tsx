import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { axe } from "../../../vitest-setup";
import { NotesMarkdown } from "./notes-markdown";

const NOTES = [
  "# Foreword",
  "2. Keep the cache warm",
  "\t3. Tip: Change 5m TTL subagent",
  "\t\t1. `ENABLE_PROMPT_CACHING_1H=1` in *settings*<br>[One](https://a.example/)[Two](https://b.example/)",
  "\t\t\t```json",
  "{",
  '  "env": {}',
  "}",
  "\t\t\t```",
  '- See <mention-page url="https://notion.example/p">🎶 Orchestrating</mention-page> **now**',
  "![Cache diagram](https://x.example/a.png)",
  "![](https://x.example/b.png)",
].join("\n");

describe("NotesMarkdown", () => {
  it("should render nested lists that keep the author's numbers", () => {
    render(<NotesMarkdown text={NOTES} />);

    const [outer, middle, inner] = screen.getAllByRole("listitem");

    expect(outer).toHaveAttribute("value", "2");
    expect(middle).toHaveAttribute("value", "3");
    expect(inner).toHaveAttribute("value", "1");
    expect(within(outer).getAllByRole("list")[0]).toContainElement(middle);
    expect(within(middle).getByRole("list")).toContainElement(inner);
  });

  it("should render a fenced block as code inside its list item, verbatim", () => {
    render(<NotesMarkdown text={NOTES} />);

    const [, , inner] = screen.getAllByRole("listitem");
    const [, block] = within(inner).getAllByRole("code");

    expect(block).toHaveTextContent('{\n  "env": {}\n}', { normalizeWhitespace: false });
  });

  it("should open links and page mentions in a new tab without a referrer", () => {
    render(<NotesMarkdown text={NOTES} />);

    const links = screen.getAllByRole("link");

    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://a.example/",
      "https://b.example/",
      "https://notion.example/p",
    ]);
    expect(links[2]).toHaveAccessibleName("🎶 Orchestrating");
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    }
  });

  it("should render inline code, emphasis, strong and line breaks", () => {
    render(<NotesMarkdown text={NOTES} />);

    const [, , inner] = screen.getAllByRole("listitem");

    expect(within(inner).getAllByRole("code")[0]).toHaveTextContent("ENABLE_PROMPT_CACHING_1H=1");
    expect(within(inner).getByRole("emphasis")).toHaveTextContent("settings");
    expect(inner).toContainHTML("<br>");
    expect(screen.getByRole("strong")).toHaveTextContent("now");
  });

  it("should render a heading as a section heading below the stop title", () => {
    render(<NotesMarkdown text={NOTES} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Foreword");
  });

  it("should show images as their italic caption only", () => {
    render(<NotesMarkdown text={NOTES} />);

    const captions = screen.getAllByRole("emphasis").slice(1);

    expect(captions.map((caption) => caption.textContent)).toEqual(["🖼 Cache diagram", "🖼 image"]);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("should render the notes without accessibility violations", async () => {
    const { container } = render(<NotesMarkdown text={NOTES} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
