import { describe, expect, it } from "vitest";

import { qrModules } from "#/talk/kit/data/logic";

import {
  barWidthAt,
  cookedText,
  elapsedSeconds,
  ESTIMATED_WALL,
  flightStart,
  OUT,
  PLATE,
  plateRules,
  QR,
  RECAP,
  thesisLines,
  tileAt,
} from "./tracks";

const { size: n, modules } = qrModules("http://localhost:3000/shownotes");
const held = modules.slice(-10);
const px = QR.size / n;
const settle = OUT.qrAt - 0.8;

describe("outro tracks", () => {
  it("should land every tile exactly on its held-back module by the settle time", () => {
    for (let i = 0; i < 10; i++) {
      const t = tileAt(i, settle, held, n);
      const m = held[9 - i] as { x: number; y: number };
      expect(t.x).toBeCloseTo(QR.left + (m.x + 0.5) * px, 6);
      expect(t.y).toBeCloseTo(QR.top + (m.y + 0.5) * px, 6);
      expect(t.ink).toBe(1);
    }
  });

  it("should land the first pocketed tile last", () => {
    const landings = Array.from({ length: 10 }, (_, i) => flightStart(i) + OUT.flyDur);
    expect(Math.max(...landings)).toBe(landings[0]);
    expect(landings[0]).toBeLessThanOrEqual(settle);
  });

  it("should keep the tiles in the bot's pile until they fly", () => {
    const t = tileAt(0, OUT.pileTo + 0.1, held, n);
    expect(t.visible).toBe(true);
    expect(t.ink).toBe(0);
    expect(t.y).toBeLessThan(PLATE.bottom);
    expect(tileAt(9, OUT.pileFrom, held, n).visible).toBe(false);
  });

  it("should creep the short bar by at most 10 px per story second in the hold", () => {
    const shrink = barWidthAt(OUT.thesisAt) - barWidthAt(OUT.thesisAt + 2);
    expect(shrink).toBeGreaterThan(0);
    expect(shrink / 2).toBeLessThanOrEqual(10);
  });

  it("should stretch the prompt box rules to the plate", () => {
    const { top, bottom } = plateRules(OUT.rulesTo, 300);
    expect(top).toEqual({ x: PLATE.left, y: PLATE.top, w: PLATE.width });
    expect(bottom.y).toBe(PLATE.bottom);
  });

  it("should fall back to the estimated wall clock before the talk has run ten minutes", () => {
    expect(elapsedSeconds(4)).toBe(ESTIMATED_WALL + 4);
    expect(elapsedSeconds(1200)).toBe(1200);
  });

  it("should fill the elapsed time into the completion line", () => {
    expect(cookedText("✻ Cooked for {elapsed} · ↓ ≈3k tokens", 1129)).toBe(
      "Cooked for 18m 49s · ↓ ≈3k tokens",
    );
  });

  it("should split the thesis at its italic phrase", () => {
    expect(
      thesisLines("It's basically all about context management.", "context management"),
    ).toEqual(["It's basically all about", "context management."]);
  });

  it("should recap all eleven completion lines in talk order", () => {
    expect(RECAP).toHaveLength(11);
    expect(RECAP[0]).toEqual({ pastVerb: "Churned", duration: "1m 30s" });
    expect(RECAP.at(-1)).toEqual({ pastVerb: "Cogitated", duration: "1m 15s" });
  });
});
