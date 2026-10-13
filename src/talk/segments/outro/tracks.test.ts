import { describe, expect, it } from "vitest";

import { qrModules } from "#/talk/kit/data/logic";
import { maxStep, sampleSpan } from "#/talk/segments/shared/test-utils";

import {
  barWidthAt,
  cookedText,
  elapsedSeconds,
  ESTIMATED_WALL,
  flightStart,
  homeCrane,
  INK_FROM,
  LABEL,
  OUT,
  PLATE,
  plateCrane,
  plateFed,
  plateRules,
  QR,
  RECAP,
  SCROLLBACK,
  tileAt,
} from "./tracks";

const { size: n, modules } = qrModules("http://localhost:3000/shownotes");
const held = modules.slice(-10);
const px = QR.size / n;
const settle = OUT.qrAt - 0.8;
// The label's bottom edge as rendered (one 56 px line, plus descenders)
const LABEL_BOTTOM = LABEL.top + 84;

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

  it("should recap all eleven completion lines in talk order", () => {
    expect(RECAP).toHaveLength(11);
    expect(RECAP[0]).toEqual({ pastVerb: "Churned", duration: "1m 30s" });
    expect(RECAP.at(-1)).toEqual({ pastVerb: "Cogitated", duration: "1m 15s" });
  });

  it("should scroll back from the newest completion line to tip 1", () => {
    expect(SCROLLBACK[0]).toEqual(RECAP.at(-1));
    expect(SCROLLBACK.at(-1)).toEqual(RECAP[0]);
  });

  it("should feed no ivory before the QR prints and the whole plate once it has", () => {
    expect(plateFed(OUT.qrFrom - 0.01, n)).toBe(0);
    expect(plateFed(OUT.qrFrom, n)).toBeGreaterThan(0);
    expect(plateFed(OUT.qrTo, n)).toBe(QR.size);
  });

  it("should feed the plate under every held-back module before its tile inks", () => {
    for (let i = 0; i < 10; i++) {
      const m = held[9 - i] as { x: number; y: number };
      const inks = flightStart(i) + INK_FROM * OUT.flyDur;
      expect(plateFed(inks, n)).toBeGreaterThanOrEqual((m.y + 1) * px);
    }
  });

  it("should keep flying tiles below the show notes label", () => {
    const tops = Array.from({ length: 10 }, (_, i) =>
      Array.from({ length: 21 }, (_, k) =>
        tileAt(i, flightStart(i) + (k / 20) * OUT.flyDur, held, n),
      ),
    )
      .flat()
      .filter((t) => t.x > LABEL.left - t.size / 2)
      .map((t) => t.y - t.size / 2);
    expect(tops.length).toBeGreaterThan(0);
    expect(Math.min(...tops)).toBeGreaterThan(LABEL_BOTTOM);
  });

  it("should hold the home shot at identity through the match cut", () => {
    expect(OUT.craneIn - OUT.start).toBeGreaterThanOrEqual(0.2);
    for (const tau of [OUT.start, OUT.start + 0.05, OUT.craneIn])
      expect(homeCrane(tau)).toEqual({ y: 0, scale: 1 });
  });

  it("should settle the recap on tip 1 before the camera cranes on to the bar", () => {
    expect(OUT.craneIn + OUT.craneInDur).toBeLessThanOrEqual(OUT.recapAt);
    expect(OUT.wipeFrom - (OUT.recapAt + OUT.recapDur)).toBeGreaterThanOrEqual(0.3);
  });

  it("should crane on to the bar over at least 0.35 s without jumping", () => {
    expect(OUT.wipeDur).toBeGreaterThanOrEqual(0.35);
    const ys = sampleSpan((tau) => plateCrane(tau).y, OUT.wipeFrom, OUT.wipeDur);
    expect(maxStep(ys)).toBeLessThan(1080 / 20);
    expect(plateCrane(OUT.wipeFrom + OUT.wipeDur)).toEqual({ y: 1080, scale: 1 });
  });
});
