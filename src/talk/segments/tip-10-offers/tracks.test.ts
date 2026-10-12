import { describe, expect, it } from "vitest";

import { sampleKeys } from "#/engine/motion/track";
import { SCRIPT } from "#/talk/script";

import {
  instantX,
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
    expect(tickets[3]?.meta).toBe("Ends Friday 16 Oct, 5:59 PM AEDT");
  });
});
