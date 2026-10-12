import { keys } from "#/engine/motion/track";
import { AA_POINTS, type AaEffort } from "#/talk/data/aa";
import { DEFAULT_CALLOUTS, scatterLayout } from "#/talk/kit/data/scatter-layout";

import { arcAt, dialSeats, type Pt } from "./tracks";

/** Tip 3 story times (absolute τ; storyboard §7 stops 15–16, window = [start + 1.4, end + 1.4)). */
export const T3 = Object.freeze({
  winStart: 133.9,
  winEnd: 151.9,
  typeAt: 134.0,
  submitAt: 134.85,
  spinnerAt: 135.05,
  leave: 135.6,
  lastGen: { at: 138.5, holdEnd: 141 },
  aa: { at: 147, holdEnd: 150.5, chartStart: 141.1, frontier: { start: 144, end: 145.6 } },
});

export const T3_TOKENS = keys([T3.spinnerAt, 31_400], [T3.aa.holdEnd, 38_900]);

export const EFFORTS: readonly AaEffort[] = ["low", "medium", "high", "xhigh", "max"];
export const EFFORT_GLYPHS = ["✢", "✳", "✶", "✻", "✽"] as const;

/** Where the live spinner glyph sits in the home shot (stage px). */
export const SPIN_AT: Pt = { x: 218, y: 500 };

export const DIAL = Object.freeze({ center: { x: 1370, y: 730 }, radius: 270 });
export const DIAL_SEATS = dialSeats(DIAL.center, DIAL.radius);
export const glyphSize = (i: number) => 64 + i * 16;

/** The chart's box on stage (the W3 picker's ScatterChart). */
export const CHART = Object.freeze({ x: 300, y: 380, w: 900, h: 520 });

const layout = scatterLayout(AA_POINTS, CHART.w, CHART.h, DEFAULT_CALLOUTS);

/** Stage px of a chart marker. */
const onStage = (p: Pt): Pt => ({ x: CHART.x + p.x, y: CHART.y + p.y });

/** Order in which the chart drops its markers (left to right). */
const dropOrder = layout.markers
  .map((m, i) => ({ i, x: m.x }))
  .sort((a, b) => a.x - b.x)
  .map((o) => o.i);

/** For each effort: the Opus marker it becomes and the τ that marker starts dropping in. */
export const OPUS_TARGETS = EFFORTS.map((effort) => {
  const i = layout.markers.findIndex(
    (m) => m.p.model === "Claude Opus 5.5" && m.p.effort === effort,
  );
  const m = layout.markers[i];
  if (!m) throw new Error(`No Opus 5.5 ${effort} point`);
  return { ...onStage(m), drop: T3.aa.chartStart + 0.6 + dropOrder.indexOf(i) * 0.12 };
});

/** The frontier polyline in stage px, and where the bot stands at the stop's `at`. */
export const FRONTIER: readonly Pt[] = layout.frontierSlugs.map((slug) => {
  const m = layout.markers.find((k) => k.p.slug === slug);
  if (!m) throw new Error(`No marker ${slug}`);
  return onStage(m);
});

const HIGH = layout.frontierSlugs.indexOf("claude-opus-5-5-high");
/** Between Opus 5.5 high and Opus 5.5 xhigh at `at`. */
export const BOT_ARC_AT = arcAt(FRONTIER, HIGH, 0.45);
