import { describe, expect, it } from "vitest";

import { botFeet, SPOTS } from "./bot";
import {
  appendSlide,
  blockAt,
  ambientView,
  N_BLOCKS,
  PREFIX_COLS,
  project,
  rowCol,
  scanX,
  suffixFront,
  viewAt,
} from "./scene";
import { IDLE, KV, PRICE, STATELESS, SWITCH, T, TTL, WINDOW } from "./timing";

const STOPS = [STATELESS, KV, PRICE, TTL, IDLE, SWITCH];

describe("tip 2 scene", () => {
  it("should map staircase indices onto rows that each add three blocks", () => {
    expect(rowCol(0)).toEqual({ row: 0, col: 0 });
    expect(rowCol(12)).toEqual({ row: 1, col: 0 });
    expect(rowCol(65)).toEqual({ row: 3, col: 20 });
  });

  it("should project the unrotated view onto stage pixels unchanged", () => {
    const p = project({ ax: 0, ay: 0, px: 960, py: 700, zoom: 1 }, 300, 400);
    expect(p.x).toBeCloseTo(300);
    expect(p.y).toBeCloseTo(400);
  });

  it("should park the scan line at the suffix boundary by the stateless stop", () => {
    expect(scanX(STATELESS.at)).toBe(200 + PREFIX_COLS * 56);
  });

  it("should only creep inside every hold", () => {
    for (const stop of STOPS) {
      const a = viewAt(stop.at);
      const b = viewAt(stop.at + stop.holdSpan);
      expect(Math.abs(b.ay - a.ay) / stop.holdSpan).toBeLessThanOrEqual(0.0262);
      expect(Math.abs(b.ax - a.ax) / stop.holdSpan).toBeLessThanOrEqual(0.0262);
      for (let i = 0; i < N_BLOCKS; i++) {
        const p = blockAt(i, stop.at);
        const q = blockAt(i, stop.at + stop.holdSpan - 0.01);
        expect(Math.abs(q.x - p.x) / stop.holdSpan).toBeLessThanOrEqual(i >= 66 ? 60 : 30);
      }
    }
  });

  it("should keep the suffix wave below the top until after the kv hold", () => {
    expect(suffixFront(KV.at)).toBeCloseTo(3, 1);
    expect(suffixFront(KV.at + KV.holdSpan)).toBeLessThan(6);
  });

  it("should hide every token block while the pricing card is up", () => {
    for (let i = 0; i < N_BLOCKS; i++) expect(blockAt(i, PRICE.at).s).toBe(0);
  });

  it("should keep the ambient sway off at both home shots", () => {
    const home = viewAt(WINDOW.start);
    expect(ambientView(home, WINDOW.start, 3.7)).toEqual(home);
    expect(ambientView(viewAt(T.home), T.home, 3.7)).toEqual(viewAt(T.home));
  });

  it("should sway the camera on ambient time inside a stop", () => {
    const view = viewAt(KV.at);
    expect(ambientView(view, KV.at, 10).ay).not.toBeCloseTo(ambientView(view, KV.at, 14).ay, 3);
  });

  it("should leave turn nine twelve px to slide at the switch stop", () => {
    expect(appendSlide(2, SWITCH.at)).toBeGreaterThan(0);
    expect(appendSlide(2, SWITCH.at)).toBeLessThanOrEqual(12);
    expect(appendSlide(0, SWITCH.at)).toBe(0);
  });

  it("should return the same block regardless of the order τ is sampled in", () => {
    const fresh = blockAt(30, 121.5);
    blockAt(30, 129);
    blockAt(30, 84);
    expect(blockAt(30, 121.5)).toEqual(fresh);
  });

  it("should start and end the segment with the bot at home", () => {
    expect(botFeet(WINDOW.start)).toEqual(SPOTS.home);
    expect(botFeet(T.home)).toEqual(SPOTS.home);
  });
});
