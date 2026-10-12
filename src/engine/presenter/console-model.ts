/** `m:ss` (or `-m:ss`) for a duration in ms. */
export function formatClock(ms: number): string {
  const sign = ms < 0 ? "-" : "";
  const total = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${sign}${m}:${String(s).padStart(2, "0")}`;
}

export type Pace = "ahead" | "on" | "behind";

/** Compares elapsed time to the share of the budget the stop index implies. */
export function pace(elapsedMs: number, target: number, count: number, budgetS: number): Pace {
  if (count <= 1) return "on";
  const expected = (target / (count - 1)) * budgetS * 1000;
  const slack = 0.05 * budgetS * 1000;
  if (elapsedMs > expected + slack) return "behind";
  if (elapsedMs < expected - slack) return "ahead";
  return "on";
}
