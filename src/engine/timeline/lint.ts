import { DEFAULT_TUNING, holdEnd, type Tuning } from "#/engine/clock/planner";
import { isSpring, settleTime } from "#/engine/motion/spring";
import type { Key, TrackSpec } from "#/engine/motion/track";
import type { Beat, Segment, Stop } from "#/engine/types";

export type TimelineInput = {
  stops: readonly Stop[];
  beats: readonly Beat[];
  segments: readonly Segment[];
  /** Track specs to check for landings inside hold windows */
  tracks?: readonly { id: string; spec: TrackSpec }[];
  tuning?: Partial<Tuning>;
};

export type LintResult = { errors: string[]; warnings: string[] };

const MAX_MOTION_GAP = 6;
const WARN_MOTION_GAP = 3;
const EPS = 1e-6;

const fmt = (n: number) => `${+n.toFixed(3)}`;

/** Story seconds the planner spends braking into a stop; the next hold must end before it starts. */
export function leadIn(stop: Stop, tuning: Partial<Tuning> = {}): number {
  const t = { ...DEFAULT_TUNING, ...tuning };
  return (t.brake * (t.cruise + (stop.holdSpeed ?? t.holdSpeed))) / 2;
}

/** Story time in [a, b] spent outside every hold window. */
export function motionTime(stops: readonly Stop[], a: number, b: number): number {
  let held = 0;
  for (const s of stops) held += Math.max(0, Math.min(b, holdEnd(s)) - Math.max(a, s.at));
  return Math.max(0, b - a - held);
}

function holdContaining(stops: readonly Stop[], tau: number) {
  return stops.find((s) => tau > s.at + EPS && tau <= holdEnd(s) + EPS);
}

function lintStops(stops: readonly Stop[], tuning: Partial<Tuning>, r: LintResult) {
  const ids = new Set<string>();
  stops.forEach((s, i) => {
    if (ids.has(s.id)) r.errors.push(`stop ${s.id}: duplicate id`);
    ids.add(s.id);
    if (!(s.holdSpan > 0)) r.errors.push(`stop ${s.id}: holdSpan must be positive`);
    if (i + 1 >= stops.length) return;
    const next = stops[i + 1];
    if (next.at <= s.at) {
      r.errors.push(`stop ${next.id}: at ${fmt(next.at)} is not after ${s.id} (${fmt(s.at)})`);
      return;
    }
    const brakeFrom = next.at - leadIn(next, tuning);
    if (holdEnd(s) >= brakeFrom) {
      r.errors.push(
        `stop ${s.id}: hold ends at ${fmt(holdEnd(s))}, after ${next.id}'s lead-in starts at ${fmt(brakeFrom)}`,
      );
    }
  });
}

function lintSegments(segments: readonly Segment[], r: LintResult) {
  for (const seg of segments) {
    if (!(seg.window.end > seg.window.start)) r.errors.push(`segment ${seg.id}: empty window`);
    for (const s of seg.stops) {
      if (s.at < seg.window.start || holdEnd(s) > seg.window.end) {
        r.errors.push(`segment ${seg.id}: stop ${s.id} hold is outside the segment window`);
      }
    }
  }
}

function lintBeatLanding(stops: readonly Stop[], b: Beat, r: LintResult) {
  if (b.end < b.start) r.errors.push(`beat ${b.id}: ends before it starts`);
  const hold = holdContaining(stops, b.start);
  if (hold) {
    r.warnings.push(`beat ${b.id}: starts inside ${hold.id}'s hold at ${fmt(b.start)}`);
    return;
  }
  const landsIn = holdContaining(stops, b.end);
  if (landsIn) {
    r.errors.push(
      `beat ${b.id}: lands at ${fmt(b.end)}, inside ${landsIn.id}'s hold (land before ${fmt(landsIn.at)})`,
    );
  }
}

function lintMotionGaps(stops: readonly Stop[], beats: readonly Beat[], r: LintResult) {
  const events = [
    ...beats.map((b) => ({
      at: b.start,
      label: `beat ${b.id}`,
      long: b.summary.includes("long-move"),
    })),
    ...stops.map((s) => ({ at: holdEnd(s), label: `${s.id} hold end`, long: false })),
  ].sort((a, b) => a.at - b.at);
  for (let i = 1; i < events.length; i++) {
    const a = events[i - 1];
    const b = events[i];
    const gap = motionTime(stops, a.at, b.at);
    const where = `${a.label} → ${b.label}`;
    if (gap > MAX_MOTION_GAP) r.errors.push(`${where}: ${fmt(gap)} s of motion without a beat`);
    else if (gap > WARN_MOTION_GAP && !a.long) {
      r.warnings.push(
        `${where}: ${fmt(gap)} s of motion without a beat (tag "long-move" if intended)`,
      );
    }
  }
}

function lintBeats(stops: readonly Stop[], beats: readonly Beat[], r: LintResult) {
  for (const b of beats) lintBeatLanding(stops, b, r);
  if (beats.length > 0) lintMotionGaps(stops, beats, r);
}

/** A key that lands inside a hold must have started in it and must not overshoot. */
function lintKey(stops: readonly Stop[], where: string, prev: Key, key: Key, r: LintResult) {
  if (key.value === prev.value) return;
  const spring = isSpring(key.ease) ? key.ease : undefined;
  const landing = spring ? Math.min(key.at, prev.at + settleTime(spring)) : key.at;
  const hold = holdContaining(stops, landing);
  if (!hold) return;
  if (prev.at < hold.at - EPS) {
    r.errors.push(
      `track ${where}: lands at ${fmt(landing)}, inside ${hold.id}'s hold (land before ${fmt(hold.at)})`,
    );
  } else if (spring && spring.zeta < 1) {
    r.errors.push(`track ${where}: overshooting spring inside ${hold.id}'s hold`);
  }
}

function lintTracks(stops: readonly Stop[], tracks: TimelineInput["tracks"], r: LintResult) {
  for (const { id, spec } of tracks ?? []) {
    for (const [channel, track] of Object.entries(spec) as [string, readonly Key[]][]) {
      for (let i = 1; i < track.length; i++) {
        lintKey(stops, `${id}.${channel}`, track[i - 1] as Key, track[i] as Key, r);
      }
    }
  }
}

/** Pure checks over the storyboard: stop spacing, hold legibility and motion pacing. */
export function lintTimeline({
  stops,
  beats,
  segments,
  tracks,
  tuning = {},
}: TimelineInput): LintResult {
  const r: LintResult = { errors: [], warnings: [] };
  lintStops(stops, tuning, r);
  lintSegments(segments, r);
  lintBeats(stops, beats, r);
  lintTracks(stops, tracks, r);
  return r;
}
