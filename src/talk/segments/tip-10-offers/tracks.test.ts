import { describe, expect, it } from "vitest";

import { sampleKeys } from "#/engine/motion/track";
import { SCRIPT } from "#/talk/script";

import {
  CARD,
  chipFlight,
  homeIn,
  punchedLineRise,
  loop,
  peekY,
  pileCount,
  railDrift,
  resetsOut,
  ROW_PX,
  shotCam,
  T10,
  ticketCopy,
  ticketOutX,
  ticketRunKeys,
} from "./tracks";

const GLYPH = { x: 1000, y: 600, w: 20, h: 40 };
const CARDS = SCRIPT["t10-offers"].cards;

describe("tip 10 tracks", () => {
  it("should open the screenshot out of the ⏎ glyph's box", () => {
    expect(shotCam(T10.diveAt, GLYPH).card).toEqual(GLYPH);
  });

  it("should frame the Full reset row in the letterbox card by the readable deadline", () => {
    const { card, s, tx, ty } = shotCam(T10.resetsAt - 0.8, GLYPH);
    expect(card).toEqual(CARD);
    const left = tx + ROW_PX.x * s;
    const right = tx + (ROW_PX.x + ROW_PX.w) * s;
    const top = ty + ROW_PX.y * s;
    expect(left).toBeGreaterThanOrEqual(0);
    expect(right).toBeLessThanOrEqual(CARD.w);
    expect(top).toBeGreaterThan(0);
    expect(top + ROW_PX.h * s).toBeLessThan(CARD.h);
  });

  it("should hold the screenshot camera still through the resets hold", () => {
    expect(shotCam(T10.resetsHoldEnd, GLYPH)).toEqual(shotCam(T10.resetsAt, GLYPH));
  });

  it("should take at least 0.35 τ-seconds to clear the resets plate", () => {
    expect(T10.resetsOut.end - T10.resetsOut.start).toBeGreaterThanOrEqual(0.35);
    expect(resetsOut(T10.resetsHoldEnd)).toBe(0);
    expect(resetsOut(T10.ticketsAt)).toBe(1);
  });

  it("should land every ticket well before the headline settles", () => {
    for (let i = 0; i < 4; i++) {
      const last = ticketRunKeys(i).at(-1);
      expect(last?.at).toBeLessThanOrEqual(T10.headSettle - 1);
      expect(sampleKeys(ticketRunKeys(i), T10.offersAt)).toBe(0);
    }
  });

  it("should drift the rails at no more than 10 px per τ-second", () => {
    expect(railDrift(T10.offersAt + 1, 10) - railDrift(T10.offersAt, 10)).toBeCloseTo(-10, 5);
  });

  it("should keep the tickets in place until the hold ends, then run them off left", () => {
    for (let i = 0; i < 4; i++) {
      expect(ticketOutX(i, T10.offersHoldEnd)).toBe(0);
      expect(ticketOutX(i, T10.exit.ticketsOutAt + 1)).toBe(-2100);
    }
  });

  it("should duck the bot back behind the rail before the tickets leave", () => {
    expect(peekY(T10.offersAt)).toBe(0);
    expect(peekY(T10.exit.ticketsOutAt)).toBeCloseTo(150, 5);
  });

  it("should keep a title and at most two verbatim script rows on each ticket", () => {
    CARDS.forEach((card, i) => {
      const ticket = ticketCopy(card, i);
      const source = [...card.lines, ...card.labels, ...card.footnotes];
      expect(ticket.headline).toBe(card.headline);
      expect(ticket.rows.length).toBeGreaterThan(0);
      expect(ticket.rows.length).toBeLessThanOrEqual(2);
      for (const row of ticket.rows) expect(source).toContain(row);
    });
  });

  it("should keep stamps on the API credits and cloud tickets only", () => {
    expect(CARDS.map((card, i) => ticketCopy(card, i).stamp)).toEqual([
      undefined,
      "NOT CLAUDE CODE",
      "CLOSED",
      undefined,
    ]);
  });

  it("should loop ambient progress and wrap it on rewind", () => {
    expect(loop(1.6, 3.2)).toBeCloseTo(0.5, 9);
    expect(loop(-1.6, 3.2)).toBeCloseTo(0.5, 9);
  });

  it("should pocket the tenth token only in the exit", () => {
    expect(pileCount(T10.start)).toBe(9);
    expect(pileCount(T10.offersHoldEnd)).toBe(9);
    expect(pileCount(T10.end)).toBe(10);
  });

  it("should land the pocketed chip before the completion line rises away", () => {
    expect(chipFlight(T10.exit.riseAt)).toBe(1);
  });

  it("should come to rest on the home shot before the window ends", () => {
    const edge = T10.end - 0.05;
    expect(homeIn(edge)).toBe(0);
    expect(punchedLineRise(edge)).toBe(1);
  });
});
