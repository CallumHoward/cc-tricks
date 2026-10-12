import { describe, expect, it } from "vitest";

import { scriptFor } from "#/talk/script";

import {
  batonProgress,
  documentedKiro,
  exitTimes,
  placeAt,
  tip6StackDy,
  TIP6,
  typedAt,
  wrapCommand,
} from "./timing";

describe("tip 6 timing", () => {
  it("should never split a flag from its value when wrapping a command", () => {
    const lines = wrapCommand(
      "kiro-cli chat --v3 --no-interactive --model claude-sonnet-5.5 --effort high",
      40,
    );
    expect(lines.some((line) => line.trim() === "--model")).toBe(false);
    expect(lines.join(" ").replace(/\s+/g, " ")).toBe(
      "kiro-cli chat --v3 --no-interactive --model claude-sonnet-5.5 --effort high",
    );
  });

  it("should keep every wrapped kiro line within the code width", () => {
    const code = documentedKiro(scriptFor("t6-kiro").code[0]?.code ?? "");
    for (const line of wrapCommand(code, 78))
      expect(Array.from(line).length).toBeLessThanOrEqual(78);
  });

  it("should place --v3 after the chat subcommand", () => {
    expect(documentedKiro('kiro-cli --v3 chat --model x "p"')).toBe(
      'kiro-cli chat --v3 --model x "p"',
    );
    expect(documentedKiro("kiro-cli chat --v3 --model x")).toBe("kiro-cli chat --v3 --model x");
  });

  it("should finish the exit whip inside the 1.4 s exit tail", () => {
    const t = exitTimes(100);
    expect(t.whipAt + t.whipDur).toBeLessThanOrEqual(101.4);
    expect(t.pocketAt + t.pocketDur).toBeLessThanOrEqual(t.whipAt + t.whipDur);
  });

  it("should creep a baton no faster than the hold allows", () => {
    const a = batonProgress(188, 186.3, 187.2, 0.6, 0.03);
    const b = batonProgress(189, 186.3, 187.2, 0.6, 0.03);
    expect(b - a).toBeCloseTo(0.03);
    expect(batonProgress(186, 186.3, 187.2, 0.6, 0.03)).toBe(0);
  });

  it("should rest the prompt stack at home on both window boundaries", () => {
    expect(tip6StackDy(TIP6.window.start)).toBeCloseTo(0);
    expect(tip6StackDy(TIP6.window.end)).toBeCloseTo(0);
    expect(tip6StackDy(TIP6.kiro.at)).toBe(TIP6.lift.dy);
  });

  it("should finish typing the tip before it is submitted", () => {
    const prompt = scriptFor("t6-kiro").headline ?? "";
    const length = Array.from(prompt).length;
    expect(typedAt(TIP6.submitAt, TIP6.typeAt, TIP6.cps, length)).toBe(length);
  });

  it("should hold the bot's place outside its moves", () => {
    const track = [
      { at: 1, x: 0, y: 0, scale: 1 },
      { at: 2, x: 100, y: -50, scale: 0.5 },
    ];
    expect(placeAt(track, 0)).toEqual({ x: 0, y: 0, scale: 1 });
    expect(placeAt(track, 3)).toEqual({ x: 100, y: -50, scale: 0.5 });
  });
});
