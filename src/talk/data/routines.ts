/** Tip 5 chain: three Cloud routines ping Haiku so each 5h window starts when you want it. */
export type Routine = {
  id: string;
  name: string;
  /** Local minutes since midnight (AEDT) */
  at: number;
  host: "cloud";
};

export const WINDOW_HOURS = 5;
const WINDOW_MINUTES = WINDOW_HOURS * 60;

export const ROUTINES: readonly Routine[] = [
  { id: "morning", name: "Good morning", at: 5 * 60 + 30, host: "cloud" },
  { id: "afternoon", name: "Good afternoon", at: 10 * 60 + 40, host: "cloud" },
  { id: "evening", name: "Good evening", at: 15 * 60 + 50, host: "cloud" },
];

export const RULER = { from: 5 * 60, to: 21 * 60 } as const;

/** "05:30" */
export function hhmm(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** "5:30 AM" */
export function clock12(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, "0")} ${suffix}`;
}

export type ChainWindow = { ping: number; start: number; end: number };

/**
 * Each ping opens a window only if the previous one has ended; a ping inside an open window adds
 * nothing (no extra quota, it just doesn't move the refill).
 */
export function chainWindows(pings: readonly number[]): ChainWindow[] {
  const out: ChainWindow[] = [];
  for (const ping of [...pings].sort((a, b) => a - b)) {
    const last = out.at(-1);
    if (last && ping < last.end) continue;
    out.push({ ping, start: ping, end: ping + WINDOW_MINUTES });
  }
  return out;
}

export const chainLabel = (w: ChainWindow): string =>
  `${hhmm(w.ping)} ping → resets ${hhmm(w.end)}`;
