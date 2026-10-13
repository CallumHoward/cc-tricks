import { describe, expect, it } from "vitest";

import { STOPS } from "#/talk/timeline-data";

import { presenceAt, rigAt, SHOTS, STOP_SHOTS, type ShotStop } from "./shots";

const STOPS_UNDER_TEST: ShotStop[] = [
  { id: "t2-stateless", at: 80, holdSpan: 2 },
  { id: "t2-ttl", at: 92, holdSpan: 2 },
  { id: "t4-superpowers", at: 100, holdSpan: 3 },
];

// τ from `from` to `to` in `steps` even steps.
function* taus(from: number, to: number, steps: number) {
  for (let i = 0; i <= steps; i++) yield from + ((to - from) * i) / steps;
}

describe("backdrop shots", () => {
  it("should hold each stop's own shot through its hold", () => {
    expect(rigAt(81, STOPS_UNDER_TEST)).toEqual(SHOTS.plot);
    expect(rigAt(93.5, STOPS_UNDER_TEST)).toEqual(SHOTS.ripple);
    expect(rigAt(102, STOPS_UNDER_TEST)).toEqual(SHOTS.well);
  });

  it("should crane between shots without jumps", () => {
    let prev = rigAt(70, STOPS_UNDER_TEST);
    for (const tau of taus(70, 110, 4000)) {
      const rig = rigAt(tau, STOPS_UNDER_TEST);
      for (const key of Object.keys(rig) as (keyof typeof rig)[])
        expect(Math.abs(rig[key] - prev[key])).toBeLessThan(0.2);
      prev = rig;
    }
  });

  it("should crane between every pair of real stops without jumps", () => {
    let prev = rigAt(0, STOPS);
    for (const tau of taus(0, 300, 15_000)) {
      const rig = rigAt(tau, STOPS);
      for (const key of Object.keys(rig) as (keyof typeof rig)[])
        expect(Math.abs(rig[key] - prev[key])).toBeLessThan(0.4);
      prev = rig;
    }
  });

  it("should be midway between two shots halfway through the transit", () => {
    const mid = (82 + 91.4) / 2;
    const rig = rigAt(mid, STOPS_UNDER_TEST);
    expect(rig.polar).toBeCloseTo(0.5, 5);
    expect(rig.ripple).toBeCloseTo(0.5, 5);
  });

  it("should assign a shot to every stop in the talk", () => {
    expect(Object.keys(STOP_SHOTS)).toEqual(expect.arrayContaining(STOPS.map(({ id }) => id)));
  });

  it("should hide the backdrop through the title fly-through and show it by the spoiler", () => {
    for (const tau of taus(-0.6, 15, 156)) expect(presenceAt(tau)).toBe(0);
    expect(presenceAt(17.1)).toBe(1);
    let prev = 0;
    for (const tau of taus(15, 18, 60)) {
      expect(presenceAt(tau)).toBeGreaterThanOrEqual(prev);
      prev = presenceAt(tau);
    }
  });
});
