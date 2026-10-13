import { describe, expect, it } from "vitest";

import { NOTES, parseNoteSections } from "#/talk/notes";
import { STOPS } from "#/talk/timeline-data";

describe("speaker notes", () => {
  it("should key each section by its stop marker and trim surrounding blank lines", () => {
    const sections = parseNoteSections(
      "intro\n<!-- stop: a -->\n\nfirst\n\tnested\n\n<!-- stop: b -->\nsecond\n",
    );
    expect([...sections]).toEqual([
      ["a", "first\n\tnested"],
      ["b", "second"],
    ]);
  });

  it("should have notes for every stop and no unknown stops", () => {
    expect([...NOTES.keys()].sort()).toEqual(STOPS.map((stop) => stop.id).sort());
  });

  it("should keep Notion's full wording, nesting and numbering", () => {
    expect(NOTES.get("fw-taste")).toContain(
      "You ask the right questions. You know when to doubt. You choose the words to go into the box.",
    );
    expect(NOTES.get("t1-model-effort")).toContain("\t2. Specify model (default inherits)");
    expect(NOTES.get("t2-ttl")).toContain('\t\t\t```json\n{\n  "env": {');
  });

  it("should keep the author's foreword and afterword prose as written", () => {
    expect(NOTES.get("fw-invest")).toMatch(/^# Foreword\nIf you care for your craft/);
    expect(NOTES.get("aft-limits")).toContain("\nI thought of sharing my strategy here");
    expect(NOTES.get("aft-wanted")).toContain(
      "\nNow defaulting to these new 5.5 generation models",
    );
  });
});
