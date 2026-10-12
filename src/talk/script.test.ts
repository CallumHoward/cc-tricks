import { describe, expect, it } from "vitest";

import { SCRIPT, scriptFor, type ScriptCard, type StopScript } from "#/talk/script";
import { STOPS } from "#/talk/timeline-data";

const MAX_WORDS = 16;

const wordCount = (text: string) =>
  text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;

const cardRegions = (card: ScriptCard) => [
  card.headline,
  ...card.lines,
  ...card.labels,
  ...card.footnotes,
  ...card.stamps,
];

/** Every string shown on stage by region, code excluded */
function onScreenRegions(script: StopScript): string[] {
  return [
    script.kicker,
    script.headline,
    ...script.lines,
    ...script.labels,
    ...script.footnotes,
    ...script.stamps,
    ...script.ui,
    ...script.refs.map((ref) => ref.label),
    ...script.code.flatMap((block) => [block.label, block.caption]),
    ...script.tables.flatMap((table) => [...table.head, ...table.rows.flat()]),
    ...script.cards.flatMap(cardRegions),
  ].filter((text): text is string => text !== undefined);
}

const entries = Object.entries(SCRIPT) as [string, StopScript][];

describe("talk script", () => {
  it("should have a script for every stop and no script without a stop", () => {
    expect(Object.keys(SCRIPT).sort()).toEqual(STOPS.map((stop) => stop.id).sort());
  });

  it("should throw when asked for a stop without a script", () => {
    expect(() => scriptFor("nope")).toThrow('No script for stop "nope"');
  });

  it("should show something on screen for every stop", () => {
    const empty = entries
      .filter(([, script]) => onScreenRegions(script).length + script.code.length === 0)
      .map(([id]) => id);
    expect(empty).toEqual([]);
  });

  it("should give every stop speaker notes", () => {
    const silent = entries.filter(([, script]) => script.notes.length === 0).map(([id]) => id);
    expect(silent).toEqual([]);
  });

  it(`should keep every on-screen region within ${MAX_WORDS} words`, () => {
    const long = entries.flatMap(([id, script]) =>
      onScreenRegions(script)
        .filter((text) => wordCount(text) > MAX_WORDS)
        .map((text) => `${id}: ${text}`),
    );
    expect(long).toEqual([]);
  });

  it("should only list https sources and references", () => {
    const bad = entries.flatMap(([id, script]) =>
      [...script.sources, ...script.refs.map((ref) => ref.href)]
        .filter((href) => !/^https:\/\/\S+$/.test(href))
        .map((href) => `${id}: ${href}`),
    );
    expect(bad).toEqual([]);
  });

  it("should only emphasize text that appears on the stop", () => {
    const missing = entries.flatMap(([id, script]) => {
      const text = onScreenRegions(script).join("\n");
      return script.emphasis.filter((part) => !text.includes(part)).map((part) => `${id}: ${part}`);
    });
    expect(missing).toEqual([]);
  });

  it("should keep emoji off the stage", () => {
    const emoji = entries.flatMap(([id, script]) =>
      onScreenRegions(script)
        .filter((text) => /\p{Emoji_Presentation}/u.test(text))
        .map((text) => `${id}: ${text}`),
    );
    expect(emoji).toEqual([]);
  });

  it("should use US spelling in committed copy", () => {
    const all = JSON.stringify(SCRIPT);
    expect(all).not.toMatch(/subsidis|colour|behaviour|dependant|licence/i);
  });

  it("should sign the title with the byline", () => {
    expect(SCRIPT.title.lines).toContain("Callum Howard · Checkbox");
  });

  it("should reuse the corrected K/V wording", () => {
    expect(SCRIPT["t2-kv"].headline).toBe("Same prefix? Reuse its stored K/V tensors.");
    expect(SCRIPT["t2-kv"].lines).toEqual(["Run prefill only on the new suffix."]);
  });

  it("should keep the Notion wording for the idle check-in lines", () => {
    expect(SCRIPT["t2-idle"].labels).toContain("New setting 'Compacted while idle'");
    expect(SCRIPT["t2-idle"].lines).toContain("CC cloud likes to do this for PRs by default");
    expect(JSON.stringify(SCRIPT["t2-idle"].labels)).not.toContain("idleCompaction");
  });

  it("should keep the Notion wording for tip 3", () => {
    expect(SCRIPT["t3-then"].lines).toContain(
      "Opus 5 low was cheaper and better than Sonnet 5 high (dependent on the task)",
    );
    expect(SCRIPT["t3-aa"].headline).toBe("Check the current gen crossover benchmark charts");
  });

  it("should show Cloud routines at the three AEDT times without the 10:35 gag", () => {
    const ui = SCRIPT["t5-routines"].ui.join("\n");
    expect(ui).toContain("Daily at 5:30 AM");
    expect(ui).toContain("Daily at 10:40 AM");
    expect(ui).toContain("Daily at 3:50 PM");
    expect(JSON.stringify([SCRIPT["t5-routines"], SCRIPT["t5-chain"]])).not.toMatch(
      /10:35|3:40 PM|15:35|20:40|fires at/,
    );
    expect(SCRIPT["t5-chain"].ui).toEqual([
      "05:30 ping → resets 10:30",
      "10:40 ping → resets 15:40",
      "15:50 ping → resets 20:50",
      "AEDT",
    ]);
  });

  it("should show cursor-agent bracket syntax with no qualifier", () => {
    const others = SCRIPT["t6-others"];
    expect(others.code[0].code).toContain("'claude-sonnet-5-5[effort=high]'");
    expect(onScreenRegions(others).join("\n")).not.toMatch(/list-models|check names/i);
  });

  it("should show the Headroom command with the current permission flag", () => {
    const [block] = SCRIPT["t7-headroom"].code;
    expect(block.code).toContain("--permission-mode auto");
    expect(block.code).not.toContain("--enable-auto-mode");
  });

  it("should keep Perplexity in notes only", () => {
    const onStage = entries
      .filter(([, script]) => onScreenRegions(script).join("\n").includes("Perplexity"))
      .map(([id]) => id);
    expect(onStage).toEqual([]);
    expect(JSON.stringify(SCRIPT["t8-cache"].notes)).toContain("Perplexity");
  });

  it("should mark the 18x claim anecdotal", () => {
    expect(SCRIPT["t8-18x"].stamps).toEqual(["ANECDOTAL"]);
  });

  it("should caption the afterword as written", () => {
    expect(SCRIPT["aft-limits"].lines).toEqual([
      "Me going absolutely all out with parallel Fable as default model before Opus 5.5 came out",
    ]);
  });

  it("should lay the offers out as four cards", () => {
    expect(SCRIPT["t10-offers"].cards.map((card) => card.headline)).toEqual([
      "Full reset",
      "Monthly API credits",
      "Cloud sessions credit",
      "Artifact usage promotion",
    ]);
  });

  it("should keep the author's prose verbatim in the foreword and afterword notes", () => {
    expect(SCRIPT["fw-taste"].notes[0]).toMatchObject({ kind: "verbatim" });
    expect(SCRIPT["fw-invest"].notes.every((note) => note.kind === "verbatim")).toBe(true);
    expect(SCRIPT["aft-limits"].notes[0].text).toMatch(/^I thought of sharing my strategy/);
    expect(SCRIPT["aft-wanted"].notes[0].text).toMatch(/^Now defaulting to these new 5\.5/);
  });
});
