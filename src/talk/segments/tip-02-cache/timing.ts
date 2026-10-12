import { STOPS, type StopData } from "#/talk/timeline-data";

function stop(id: string): StopData {
  const found = STOPS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown stop ${id}`);
  return found;
}

export const STATELESS = stop("t2-stateless");
export const KV = stop("t2-kv");
export const PRICE = stop("t2-price");
export const TTL = stop("t2-ttl");
export const IDLE = stop("t2-idle");
export const SWITCH = stop("t2-switch");

export const holdEnd = (s: StopData): number => s.at + s.holdSpan;

/** Segment window (EXIT_TAIL = 1.4 after each segment start). */
export const WINDOW = Object.freeze({ start: 69.9, end: 133.9 });

/** Absolute τ of every sub-hit in the storyboard beat tables, plus the turn and the exit. */
export const T = Object.freeze({
  // turn in
  typeAt: 70.0,
  // stateless b2–b4
  dive: 71.5,
  tapeIn: 71.9,
  tapeHome: 73.2,
  reply: 73.3,
  hinge: 74.9,
  drawerOut: 75.2,
  drawerShut: 76.2,
  headline1: 76.5,
  rows: [77.6, 78.0, 78.5] as const,
  scan: 78.8,
  scanEnd: 79.6,
  // kv
  kvMorph: 83.1,
  kvSettled: 84.6,
  wave: 86.1,
  waveEnd: 88.0,
  wallStack: 88.4,
  reask: 89.0,
  strike: 89.6,
  wallBack: 90.0,
  // price
  plan: 94.6,
  columns: 95.7,
  priceCopy: 97.6,
  // ttl
  cut: 103.0,
  irisStart: 105.2,
  irisEnd: 106.0,
  rings: 106.4,
  ringsLand: 107.0,
  ttlHead: 107.6,
  subRow: 109.6,
  freeze: 110.3,
  fix: 110.5,
  // idle
  crack: 115.6,
  /** The ttl plate has wiped out by now, so nothing of the idle plate lands before it. */
  idleIn: 115.85,
  clock: 116.1,
  clockEnd: 117.2,
  spike: 117.3,
  idleCopy: 117.7,
  notice: 118.6,
  pulse: 119.0,
  pulseEnd: 120.3,
  pulse2: 120.9,
  // switch
  pitch: 123.6,
  fork: 124.7,
  tip: 125.4,
  turn7: 125.5,
  turn8: 126.8,
  turn9: 127.4,
  switchCopy: 127.7,
  // exit
  fold: 132.5,
  foldEnd: 132.85,
  pocket: 132.95,
  whip: 133.25,
  whipDur: 0.45,
  home: 133.72,
});
