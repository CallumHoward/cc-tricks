import { describe, expect, it } from "vitest";

import { SCRIPT } from "#/talk/script";
import { SHOWNOTES } from "#/talk/shownotes-data";

const allTips = [...SHOWNOTES.tips, SHOWNOTES.bonus];
const allLinks = [...allTips.flatMap((tip) => tip.links), ...SHOWNOTES.references];

describe("shownotes data", () => {
  it("should number the tips 1 to 10 in order", () => {
    expect(SHOWNOTES.tips.map((tip) => tip.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("should use unique tip ids", () => {
    expect(new Set(allTips.map((tip) => tip.id)).size).toBe(allTips.length);
  });

  it("should give every tip key lines and a source link", () => {
    const thin = allTips
      .filter((tip) => tip.points.length === 0 || tip.links.length === 0)
      .map((tip) => tip.id);
    expect(thin).toEqual([]);
  });

  it("should only link to https URLs", () => {
    const bad = allLinks
      .filter(({ href, label }) => !/^https:\/\/\S+$/.test(href) || label.length === 0)
      .map(({ href }) => href);
    expect(bad).toEqual([]);
  });

  it("should not repeat a link within a section", () => {
    const repeated = allTips
      .filter((tip) => new Set(tip.links.map((l) => l.href)).size !== tip.links.length)
      .map((tip) => tip.id);
    expect(repeated).toEqual([]);
  });

  it("should list the additional references", () => {
    const hrefs = SHOWNOTES.references.map((ref) => ref.href);
    expect(hrefs).toEqual([
      "https://www.andreagrandi.it/posts/claude-code-subagents-to-save-usage/",
      "https://app.notion.com/p/3648183ab6f6805f947cc12560e59549",
      "https://www.youtube.com/watch?v=_NdFTCUk-t4",
    ]);
  });

  it("should carry every stage code block into the shownotes unless it is elided", () => {
    const snippets = new Set(allTips.flatMap((tip) => tip.snippets.map((s) => s.code)));
    const missing = Object.entries(SCRIPT).flatMap(([id, script]) =>
      script.code
        .filter((block) => !block.code.includes("…") && !snippets.has(block.code))
        .map((block) => `${id}: ${block.code}`),
    );
    expect(missing).toEqual([]);
  });

  it("should show the full cursor-agent, copilot and codex commands", () => {
    const codes = SHOWNOTES.tips[5].snippets.map((s) => s.code);
    expect(codes).toContain(
      `cursor-agent -p --force --model 'claude-sonnet-5-5[effort=high]' "prompt"`,
    );
    expect(codes.join("\n")).not.toContain("…");
  });

  it("should use the current Headroom permission flag", () => {
    const [snippet] = SHOWNOTES.tips[6].snippets;
    expect(snippet.code).toContain("--permission-mode auto");
  });

  it("should keep the afterword in two paragraphs of the author's prose", () => {
    expect(SHOWNOTES.afterword).toHaveLength(2);
  });
});
