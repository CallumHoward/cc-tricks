import type { StageCommand } from "#/engine/stage/stage";
import type { NavAction } from "#/engine/types";

export type KeyInput = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
};

export type KeyIntent = { type: "nav"; action: NavAction } | StageCommand;

/** Typed digits awaiting Enter. */
export type KeyState = { digits: string };

export const INITIAL_KEY_STATE: KeyState = { digits: "" };

const NEXT = new Set(["ArrowRight", " ", "PageDown"]);
const PREV = new Set(["ArrowLeft", "PageUp"]);

const nav = (action: NavAction): KeyIntent => ({ type: "nav", action });

/** Pure key map (decisions D12); digits+Enter go to a 1-based stop number. */
export function reduceKey(
  state: KeyState,
  input: KeyInput,
): { state: KeyState; intent?: KeyIntent } {
  if (input.metaKey || input.ctrlKey || input.altKey) return { state };
  const { key } = input;
  if (/^\d$/.test(key)) return { state: { digits: (state.digits + key).slice(-3) } };
  const cleared = state.digits === "" ? state : INITIAL_KEY_STATE;
  if (key === "Enter") {
    const n = Number.parseInt(state.digits, 10);
    return Number.isNaN(n) || n < 1
      ? { state: cleared }
      : { state: cleared, intent: nav({ type: "goto", index: n - 1 }) };
  }
  if (NEXT.has(key)) return { state: cleared, intent: nav({ type: "next" }) };
  if (PREV.has(key)) return { state: cleared, intent: nav({ type: "prev" }) };
  switch (key.toLowerCase()) {
    case "home":
      return { state: cleared, intent: nav({ type: "first" }) };
    case "end":
      return { state: cleared, intent: nav({ type: "last" }) };
    case "b":
    case ".":
      return { state: cleared, intent: { type: "blackout" } };
    case "f":
      return { state: cleared, intent: { type: "fullscreen" } };
    case "m":
      return { state: cleared, intent: { type: "mute" } };
    case "p":
      return { state: cleared, intent: { type: "presenter" } };
    default:
      return { state: cleared };
  }
}

/** Elements whose own keyboard or click handling must win over navigation. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return (
    target.closest(
      "input, textarea, select, button, a[href], [contenteditable=''], [contenteditable='true'], [data-interactive]",
    ) !== null
  );
}
