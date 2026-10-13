import { describe, expect, it } from "vitest";

import { AA_POINTS, aaLabel } from "#/talk/data/aa";

import {
  dataSpring,
  fmtTokens,
  fmtUSD,
  logScale,
  overlaps,
  paretoFrontier,
  placeLabels,
  qrModules,
  qrRevealCount,
  ringLeft,
  segmentHitsRect,
} from "./logic";

describe("data kit logic", () => {
  it("should map log-scale ticks evenly", () => {
    const x = logScale(0.3, 10, 0, 1000);
    expect(x(0.3)).toBe(0);
    expect(x(10)).toBeCloseTo(1000);
    expect(x(1) - x(0.3)).toBeCloseTo(x(10) - x(3));
  });

  it("should put both 56-point models on the AA frontier", () => {
    const frontier = paretoFrontier(
      AA_POINTS.map((p) => ({ x: p.costPerTaskUSD, y: p.intelligenceIndex })),
    );
    const labels = frontier.map((i) => aaLabel(AA_POINTS[i]!));
    expect(labels).toContain("Opus 5.5 xhigh");
    expect(labels).toContain("Sonnet 5.5 max");
    expect(labels).not.toContain("Sonnet 5.5 xhigh");
    expect(labels).not.toContain("GPT-6 Astra");
  });

  it("should place labels without overlapping each other or markers", () => {
    const markers = [
      { x: 95, y: 95, w: 10, h: 10 },
      { x: 115, y: 95, w: 10, h: 10 },
      { x: 105, y: 115, w: 10, h: 10 },
    ];
    const placed = placeLabels(
      markers.map((m) => ({ x: m.x + 5, y: m.y + 5, w: 120, h: 30 })),
      markers,
      { x: 0, y: 0, w: 400, h: 300 },
    );
    const rects = placed.filter((r) => r !== null);
    expect(rects).toHaveLength(3);
    for (const [i, a] of rects.entries()) {
      for (const b of rects.slice(i + 1)) expect(overlaps(a, b)).toBe(false);
      for (const m of markers) expect(overlaps(a, m)).toBe(false);
    }
  });

  it("should never overshoot a data value", () => {
    for (let t = 0; t < 2; t += 0.01) expect(dataSpring(t, 0, 100)).toBeLessThanOrEqual(100);
    expect(dataSpring(5, 0, 100)).toBe(100);
  });

  it("should burn a ring down linearly between its start and end", () => {
    expect(ringLeft(0, 1, 3)).toBe(1);
    expect(ringLeft(2, 1, 3)).toBe(0.5);
    expect(ringLeft(9, 1, 3)).toBe(0);
  });

  it("should reveal QR modules row by row and finish with every module", () => {
    const { size, modules } = qrModules("https://example.com/shownotes");
    expect(modules[0]!.y).toBe(4);
    expect(qrRevealCount(modules, size, 0)).toBe(0);
    expect(qrRevealCount(modules, size, 1)).toBe(modules.length);
    const half = qrRevealCount(modules, size, 0.5);
    expect(modules.slice(0, half).every((m) => m.y < size / 2)).toBe(true);
  });

  it("should format prices and token counts for display", () => {
    expect(fmtUSD(0.02)).toBe("$0.02");
    expect(fmtUSD(0.025)).toBe("$0.025");
    expect(fmtUSD(0.8)).toBe("$0.80");
    expect(fmtUSD(3.459)).toBe("$3.46");
    expect(fmtTokens(197_430)).toBe("197k");
    expect(fmtTokens(1_000_000)).toBe("1M");
  });

  it("should detect a leader line crossing a label", () => {
    const r = { x: 10, y: 10, w: 10, h: 10 };
    expect(segmentHitsRect({ x1: 0, y1: 15, x2: 30, y2: 15 }, r)).toBe(true);
    expect(segmentHitsRect({ x1: 0, y1: 0, x2: 30, y2: 0 }, r)).toBe(false);
  });
});
