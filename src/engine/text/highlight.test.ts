import { describe, expect, it } from "vitest";

import { tokenizeLine } from "#/engine/text/highlight";

const kinds = (line: string, lang: Parameters<typeof tokenizeLine>[1]) =>
  tokenizeLine(line, lang)
    .filter((t) => t.text.trim() !== "")
    .map((t) => `${t.kind}:${t.text}`);

describe("tokenizeLine", () => {
  it("should split a JSON member into key, punctuation and string", () => {
    expect(kinds('  "subagentPromptCacheTtl": "1h",', "json")).toEqual([
      'key:"subagentPromptCacheTtl"',
      "punct::",
      'string:"1h"',
      "punct:,",
    ]);
  });

  it("should mark JSON literals and numbers", () => {
    expect(kinds('"promptSuggestionEnabled": false, "n": 12', "json")).toEqual([
      'key:"promptSuggestionEnabled"',
      "punct::",
      "literal:false",
      "punct:,",
      'key:"n"',
      "punct::",
      "number:12",
    ]);
  });

  it("should split YAML keys, values, markers and comments", () => {
    expect(kinds("  cacheTtl: 1h # bucket", "yaml")).toEqual([
      "key:cacheTtl",
      "punct::",
      "plain:1h",
      "comment:# bucket",
    ]);
    expect(kinds("---", "yaml")).toEqual(["punct:---"]);
    expect(kinds("effort: low", "yaml")).toEqual(["key:effort", "punct::", "plain:low"]);
  });

  it("should mark the shell command, flags and quoted strings", () => {
    expect(
      kinds(`cursor-agent -p --force --model 'claude-sonnet-5-5[effort=high]' "prompt"`, "sh"),
    ).toEqual([
      "command:cursor-agent",
      "flag:-p",
      "flag:--force",
      "flag:--model",
      "string:'claude-sonnet-5-5[effort=high]'",
      'string:"prompt"',
    ]);
  });

  it("should keep every character of the line in order", () => {
    const line = '{ "env": { "ENABLE_PROMPT_CACHING_1H": "1" } }';
    expect(
      tokenizeLine(line, "json")
        .map((t) => t.text)
        .join(""),
    ).toBe(line);
  });
});
