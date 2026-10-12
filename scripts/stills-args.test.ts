import { describe, expect, it } from "vitest";

import { frameFileName, linspace, parseStillsArgs, stillUrl, timelineFrames } from "./stills-args";

const noFile = (): string => {
  throw new Error("unexpected read");
};

describe("stills args", () => {
  it("should parse an explicit tau list", () => {
    const args = parseStillsArgs(["--taus", "0,1.5,12", "--out", "shots", "--cols=3"], noFile);
    expect(args.frames.map((f) => f.tau)).toEqual([0, 1.5, 12]);
    expect(args.frames[1]?.label).toBe("τ=1.50");
    expect(args.out).toBe("shots");
    expect(args.cols).toBe(3);
  });

  it("should sample an evenly spaced range inclusive of both ends", () => {
    const args = parseStillsArgs(["--from", "2", "--to", "4", "--n", "5"], noFile);
    expect(args.frames.map((f) => f.tau)).toEqual([2, 2.5, 3, 3.5, 4]);
    expect(linspace(3, 9, 1)).toEqual([3]);
  });

  it("should take one frame per beat midpoint and stop, merging duplicates", () => {
    const frames = timelineFrames({
      stops: [{ id: "intro", at: 4 }],
      beats: [
        { id: "slam", start: 3, end: 5 },
        { id: "wipe", start: 0, end: 1 },
      ],
    });
    expect(frames.map((f) => f.tau)).toEqual([0.5, 4]);
    expect(frames[1]?.label).toBe("τ=4.00  stop:intro · slam");
  });

  it("should read beats from the timeline file", () => {
    const args = parseStillsArgs(["--beats", "t.json"], (path) => {
      expect(path).toBe("t.json");
      return JSON.stringify({ stops: [{ id: "a", at: 2 }] });
    });
    expect(args.frames).toEqual([{ tau: 2, label: "τ=2.00  stop:a" }]);
  });

  it("should reject missing modes and bad numbers", () => {
    expect(() => parseStillsArgs([], noFile)).toThrow(/--taus/);
    expect(() => parseStillsArgs(["--taus", "1,x"], noFile)).toThrow(/number/);
    expect(() => parseStillsArgs(["stray"], noFile)).toThrow(/Unexpected/);
  });

  it("should default to the stills dev server and build frozen-frame URLs", () => {
    const args = parseStillsArgs(["--taus", "1", "--w", "2.5"], noFile);
    expect(stillUrl(args, 12.25)).toBe(`${args.baseUrl}/?t=12.25&w=2.5`);
    expect(stillUrl({ baseUrl: "http://x:1", path: "/talk", w: 0 }, 1)).toBe(
      "http://x:1/talk?t=1&w=0",
    );
  });

  it("should name frames in capture order", () => {
    expect(frameFileName(7, 1.5)).toBe("frame-007-t1.500.png");
  });
});
