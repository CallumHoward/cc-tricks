import { describe, expect, it } from "vitest";

import { sampleKeys } from "#/engine/motion/track";
import { toScreen } from "#/talk/kit/motion";
import { maxStep, sampleSpan } from "#/talk/segments/shared/test-utils";

import {
  AFT,
  BOT_STAND,
  BOT_X,
  CARD_TILT,
  columnScale,
  columnY,
  emberAt,
  FABLE,
  letterAt,
  limitsCamera,
  onCard,
} from "./tracks";

const REST = { x: 960, y: 540, zoom: 1, roll: 0, tilt: 0 };

describe("afterword tracks", () => {
  it("should open on the home shot at identity", () => {
    for (const tau of [AFT.start, AFT.craneIn]) {
      expect(columnY(tau)).toBe(0);
      expect(columnScale(tau)).toBe(1);
    }
  });

  it("should settle the home shot at identity well before the match cut", () => {
    const rest = AFT.craneOut + AFT.craneOutDur;
    expect(AFT.end - rest).toBeGreaterThanOrEqual(0.2);
    for (const tau of [rest, AFT.end - 0.05, AFT.end]) {
      expect(columnY(tau)).toBe(0);
      expect(columnScale(tau)).toBe(1);
    }
  });

  it("should crane between the screens over at least 0.35 s without jumping", () => {
    expect(AFT.craneDur).toBeGreaterThanOrEqual(0.35);
    const ys = sampleSpan(columnY, AFT.craneIn, AFT.craneDur);
    expect(maxStep(ys)).toBeLessThan(1080 / 20);
    expect(ys.at(-1)).toBe(-1080);
  });

  it("should lay the card flat and land the title before the limits stop", () => {
    const settle = AFT.limitsAt - 0.8;
    expect(sampleKeys(CARD_TILT, settle)).toBe(0);
    for (let i = 0; i < 9; i++) expect(letterAt(settle, i)).toEqual({ lift: 0, spread: 0 });
  });

  it("should walk the bot into the last 5% of the Fable bar by the settle time", () => {
    const box = sampleKeys(BOT_X, AFT.limitsAt - 0.8);
    const fill = onCard(FABLE.fillEnd, FABLE.barY).x;
    const track = onCard(FABLE.trackEnd, FABLE.barY).x;
    expect(box + 120).toBe(BOT_STAND.x);
    expect(BOT_STAND.x).toBeGreaterThan(fill);
    expect(BOT_STAND.x).toBeLessThan(track);
  });

  it("should creep the camera no more than 3% through either hold", () => {
    const holds = [
      [AFT.limitsAt, AFT.limitsAt + 2],
      [AFT.wantedAt, AFT.pullFrom],
    ] as const;
    for (const [from, to] of holds)
      expect(limitsCamera(to).zoom / limitsCamera(from).zoom).toBeLessThanOrEqual(1.03);
  });

  it("should keep the bot and the 95% readout in frame at the wanted stop", () => {
    const cam = limitsCamera(AFT.wantedAt);
    expect(cam.zoom).toBeGreaterThan(1.3);
    const used = toScreen(cam, onCard(1925, FABLE.barY));
    const bot = toScreen(cam, { x: BOT_STAND.x, y: BOT_STAND.ground - 70 });
    for (const p of [used, bot]) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(1920);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(1080);
    }
  });

  it("should pull the camera back to the home framing before the exit crane", () => {
    expect(limitsCamera(AFT.craneOut + 0.2)).toMatchObject(REST);
  });

  it("should keep the embers rising at the stop as ambient time advances", () => {
    const a = emberAt(3, 100, AFT.limitsAt);
    const b = emberAt(3, 100.1, AFT.limitsAt);
    expect(b.y).toBeLessThan(a.y);
    expect(emberAt(3, 100, AFT.glowFrom - 0.1).size).toBe(0);
  });
});
