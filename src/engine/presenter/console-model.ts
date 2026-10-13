import type { KeyInput } from "#/engine/input/keys";

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

/** The talk's keys besides digits; `f` and `p` act on the presenter window, not the stage. */
const STAGE_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  " ",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "Enter",
  "Escape",
  ".",
  "b",
  "m",
  "o",
]);

const TEXT_ENTRY = "input, textarea, select, [contenteditable=''], [contenteditable='true']";

const within = (target: EventTarget | null, selector: string) =>
  target instanceof Element && target.closest(selector) !== null;

/**
 * Routes a key press in the presenter window: replay it on the stage, fullscreen this window, or
 * ignore it.
 */
export function presenterKeyAction(
  event: KeyInput & { repeat?: boolean; target: EventTarget | null },
): "stage" | "fullscreen" | null {
  if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return null;
  if (within(event.target, TEXT_ENTRY)) return null;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === "f") return "fullscreen";
  if (!STAGE_KEYS.has(key) && !/^\d$/.test(key)) return null;
  // A focused button or link activates on Enter and Space itself
  const activates = (key === "Enter" || key === " ") && within(event.target, "button, a[href]");
  return activates ? null : "stage";
}
