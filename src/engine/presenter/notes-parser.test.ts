import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { parseNotes } from "./notes-parser";

const text = (value: string) => ({ type: "text", text: value });
const code = (value: string) => ({ type: "code", text: value });
const link = (href: string, label: string) => ({ type: "link", href, children: [text(label)] });
const paragraph = (...children: unknown[]) => ({ type: "paragraph", children });

describe("parseNotes", () => {
  it("should nest list items by leading tabs under the previous shallower item", () => {
    expect(parseNotes("1. a\n\t- b\n\t\t1. c\n2. d")).toEqual([
      {
        type: "list",
        ordered: true,
        items: [
          {
            value: 1,
            children: [text("a")],
            blocks: [
              {
                type: "list",
                ordered: false,
                items: [
                  {
                    children: [text("b")],
                    blocks: [
                      {
                        type: "list",
                        ordered: true,
                        items: [{ value: 1, children: [text("c")], blocks: [] }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          { value: 2, children: [text("d")], blocks: [] },
        ],
      },
    ]);
  });

  it("should keep the author's numbers when a list starts part way through", () => {
    expect(parseNotes("2. Keep the cache warm\n\n5. Later")).toMatchObject([
      { type: "list", ordered: true, items: [{ value: 2 }, { value: 5 }] },
    ]);
  });

  it("should start a sibling list when the marker changes at the same depth", () => {
    expect(parseNotes("1. a\n- b")).toMatchObject([
      { type: "list", ordered: true },
      { type: "list", ordered: false },
    ]);
  });

  it("should attach a fence with unindented content to the item it is indented under", () => {
    const md = [
      "\t\t2. `ENABLE_PROMPT_CACHING_1H=1` – better",
      "\t\t\t```json",
      "{",
      '  "env": { "ENABLE_PROMPT_CACHING_1H": "1" }',
      "}",
      "\t\t\t```",
      "\t\t3. After",
    ].join("\n");

    expect(parseNotes(md)).toMatchObject([
      {
        type: "list",
        items: [
          {
            value: 2,
            blocks: [
              {
                type: "code",
                lang: "json",
                text: '{\n  "env": { "ENABLE_PROMPT_CACHING_1H": "1" }\n}',
              },
            ],
          },
          { value: 3, children: [text("After")], blocks: [] },
        ],
      },
    ]);
  });

  it("should keep a top-level fence verbatim and close an unterminated one at the end", () => {
    expect(parseNotes("```\n1. not a list\n\n```\n```sh\n  pnpm dev")).toEqual([
      { type: "code", lang: "", text: "1. not a list\n" },
      { type: "code", lang: "sh", text: "  pnpm dev" },
    ]);
  });

  it("should make each plain line its own paragraph and a hash line a heading", () => {
    expect(parseNotes("# Foreword\n\nA: \nB")).toEqual([
      { type: "heading", level: 1, children: [text("Foreword")] },
      paragraph(text("A:")),
      paragraph(text("B")),
    ]);
  });

  it("should parse inline code, emphasis, strong and line breaks", () => {
    expect(parseNotes("`a *b*` in *being* **bold *nested* text** ***both***<br>next")).toEqual([
      paragraph(
        code("a *b*"),
        text(" in "),
        { type: "em", children: [text("being")] },
        text(" "),
        {
          type: "strong",
          children: [text("bold "), { type: "em", children: [text("nested")] }, text(" text")],
        },
        text(" "),
        { type: "em", children: [{ type: "strong", children: [text("both")] }] },
        { type: "break" },
        text("next"),
      ),
    ]);
  });

  it("should render backslash escapes as the literal character", () => {
    expect(parseNotes("Use subagents \\[screenshot\\] \\~ \\$ \\| \\* \\_")).toEqual([
      paragraph(text("Use subagents [screenshot] ~ $ | * _")),
    ]);
  });

  it("should keep adjacent links separate", () => {
    expect(
      parseNotes("(global)<br>[One](https://a.example/x/)[Two? Yes](https://b.example/(y))"),
    ).toEqual([
      paragraph(
        text("(global)"),
        { type: "break" },
        link("https://a.example/x/", "One"),
        link("https://b.example/(y)", "Two? Yes"),
      ),
    ]);
  });

  it("should turn a page mention into a link to the page", () => {
    expect(
      parseNotes(
        'See my talk <mention-page url="https://app.notion.com/p/3648">🎶 Orchestrating Parallel Agents</mention-page>',
      ),
    ).toEqual([
      paragraph(
        text("See my talk "),
        link("https://app.notion.com/p/3648", "🎶 Orchestrating Parallel Agents"),
      ),
    ]);
  });

  it("should keep only the caption of an image line", () => {
    expect(parseNotes("![Cache \\_ diagram](https://x.example/a.png)\n![](b.png)")).toEqual([
      { type: "image", caption: [text("Cache _ diagram")] },
      { type: "image", caption: [] },
    ]);
  });

  it("should keep unknown or unbalanced syntax as plain text", () => {
    expect(parseNotes("> quote | **open `tick [x](y\n---\n####### deep")).toEqual([
      paragraph(text("> quote | **open `tick [x](y")),
      paragraph(text("---")),
      paragraph(text("####### deep")),
    ]);
  });

  it("should never throw on arbitrary input", () => {
    const unit = fc.constantFrom("\t", "\n", " ", "*", "`", "[", "]", "(", ")", "\\", "<", ">");
    const md = fc.string({
      unit: fc.oneof(unit, fc.constantFrom("1.", "- ", "#", "!", "br", "a")),
    });

    fc.assert(
      fc.property(md, (input) => {
        expect(() => parseNotes(input)).not.toThrow();
      }),
    );
  });
});
