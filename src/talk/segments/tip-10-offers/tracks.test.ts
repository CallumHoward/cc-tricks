import { describe, expect, it } from "vitest";

import { sampleKeys } from "#/engine/motion/track";
import { SCRIPT } from "#/talk/script";

import {
  bankedX,
  instantX,
  panelDrift,
  pileCount,
  railDrift,
  T10,
  tearProgress,
  ticketCopy,
  ticketRunKeys,
} from "./tracks";

describe("tip 10 tracks", () => {
  it("should have the cloud ticket 60% torn at the stop", () => {
    expect(tearProgress(T10.offersAt)).toBeCloseTo(0.6, 3);
    expect(tearProgress(T10.tearAt)).toBe(0);
  });

  it("should only creep the tear through the hold", () => {
    const step = 0.05;
    for (let tau: number = T10.offersAt; tau < T10.offersHoldEnd; tau += step) {
      expect((tearProgress(tau + step) - tearProgress(tau)) / step).toBeLessThanOrEqual(0.03);
    }
  });

  it("should leave the instant ticket its last 10 px at the stop and home by the hold end", () => {
    expect(instantX(T10.resetsAt)).toBeCloseTo(-10, 5);
    expect(instantX(T10.resetsHoldEnd)).toBeCloseTo(0, 5);
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

  it("should pocket the tenth token only in the exit", () => {
    expect(pileCount(T10.start)).toBe(9);
    expect(pileCount(T10.offersHoldEnd)).toBe(9);
    expect(pileCount(T10.end)).toBe(10);
  });

  it("should show the end date and keep stamps on the artifact and API tickets", () => {
    const tickets = SCRIPT["t10-offers"].cards.map(ticketCopy);
    expect(tickets.map((t) => t.stamp)).toEqual([
      undefined,
      "NOT CLAUDE CODE",
      "CLOSED",
      undefined,
    ]);
  });

  it("should keep every line, label and footnote of each card in order", () => {
    const tickets = SCRIPT["t10-offers"].cards.map(ticketCopy);
    expect(tickets[1]?.rows.map((r) => r.text)).toEqual(SCRIPT["t10-offers"].cards[1]?.lines);
    expect(tickets[3]?.rows).toEqual([
      { text: "Artifact work uses 50% less of your 5-hour limit.", tone: "line" },
      { text: "Claude and Cowork · not Claude Code · not weekly", tone: "label" },
      { text: "Ends Friday 16 Oct, 5:59 PM AEDT", tone: "foot" },
    ]);
  });

  it("should settle both reset tickets within 10 px by the readable deadline", () => {
    const deadline = T10.resetsAt - 0.8;
    expect(bankedX(deadline)).toBeCloseTo(0, 3);
    expect(Math.abs(instantX(deadline) + 10)).toBeLessThan(0.01);
  });

  it("should overshoot the reset tickets as they land", () => {
    let peak = Number.NEGATIVE_INFINITY;
    for (let tau = T10.bankedAt; tau < T10.bankedAt + 0.7; tau += 0.005) {
      peak = Math.max(peak, bankedX(tau));
    }
    expect(peak).toBeGreaterThan(1);
  });

  it("should only drift the Settings panel 8 px through the hold", () => {
    expect(panelDrift(T10.resetsAt)).toBeCloseTo(0, 5);
    expect(panelDrift(T10.resetsHoldEnd)).toBeCloseTo(-8, 5);
  });
});
