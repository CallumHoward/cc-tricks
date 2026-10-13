import { describe, expect, it } from "vitest";

import { repeatedLines } from "./notes-repeats";

describe("repeatedLines", () => {
  it("should mark a line an earlier stop already contained, but not the new lines under it", () => {
    const stops = ["2. Keep the cache warm\n\t1. Stateless", "2. Keep the cache warm\n\t2. Prefix"];

    expect(repeatedLines(stops)).toEqual([new Set(), new Set(["2. Keep the cache warm"])]);
  });

  it("should remember lines across stops that skip them", () => {
    const stops = ["# Foreword\nQ", "Other", undefined, "# Foreword\nA"];

    expect(repeatedLines(stops)[3]).toEqual(new Set(["# Foreword"]));
  });

  it("should ignore code fence contents when matching lines", () => {
    const fence = (body: string) => `1. Tip\n\t\`\`\`json\n${body}\n\t\`\`\``;

    expect(repeatedLines([fence("{\n}"), `${fence("{\n}")}\n2. More`])[1]).toEqual(
      new Set(["1. Tip"]),
    );
  });

  it("should mark nothing on a stop whose notes are entirely repeated", () => {
    const thesis = "Spoiler: context management";

    expect(repeatedLines([thesis, "Middle", thesis])[2]).toEqual(new Set());
  });
});
