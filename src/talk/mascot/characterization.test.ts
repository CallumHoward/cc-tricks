import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { type Act, poseAt } from "./actions";
import { drawMascot } from "./draw";

const ACTS: readonly Act[] = [
  { kind: "face", at: 0, dur: 1, expr: "joy" },
  { kind: "look", at: 0, dur: 1, x: -0.8, y: 0.4 },
  { kind: "turn", at: 0, dur: 1, to: 60 },
  { kind: "walk", at: 0, dur: 1, dx: -120, stepRate: 3 },
  { kind: "hop", at: 0, height: 40, air: 0.3 },
  { kind: "wave", at: 0, dur: 1, side: "L" },
  { kind: "point", at: 0, dur: 1, angle: -20, side: "R" },
  { kind: "shrug", at: 0, dur: 1 },
  { kind: "celebrate", at: 0, dur: 1 },
  { kind: "surprised", at: 0, dur: 1 },
  { kind: "sleepy", at: 0, dur: 1 },
  { kind: "carry", at: 0, dur: 1 },
  { kind: "push", at: 0, dur: 1, dir: -1 },
  { kind: "sweat", at: 0, dur: 1 },
  { kind: "type", at: 0, dur: 1 },
  { kind: "wave", at: 0, dur: 1 },
  { kind: "point", at: 0, dur: 1, angle: 30, side: "L" },
  { kind: "push", at: 0, dur: 1 },
  { kind: "walk", at: 0, dur: 1, dx: 0 },
];

const TAUS = [-0.1, 0.05, 0.15, 0.3, 0.55, 0.8, 1.05, 1.2, 1.6];

const round = (_: string, v: unknown) => (typeof v === "number" ? +v.toFixed(6) : v);
/** A digest keeps the pinned pose and path data out of a multi-megabyte snapshot. */
const pin = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value, round)).digest("hex").slice(0, 16);

describe("mascot characterization", () => {
  it.each(ACTS.map((act) => [act.kind, act] as const))(
    "should pose and draw %s exactly as pinned across its envelope",
    (_, act) => {
      const frames = TAUS.map((tau) => {
        const pose = poseAt([act], tau, tau * 1.7);
        return pin({ tau, pose, drawing: drawMascot(pose, Math.round(tau * 12)) });
      });
      expect(frames).toMatchSnapshot("pose and drawing digests");
    },
  );

  it.each([-170, -90, -30, 0, 45, 120, 180])(
    "should draw a mascot turned to %i degrees exactly as pinned",
    (to) => {
      const pose = poseAt([{ kind: "turn", at: 0, dur: 0.5, to }], 1, 0.4);
      const drawings = [0, 1, 2].map((d) => pin(drawMascot(pose, d)));
      const flat = pin(drawMascot(pose, 0, { boil: 0, silhouette: "#141413" }));
      expect([...drawings, flat]).toMatchSnapshot("drawing digests");
    },
  );
});
