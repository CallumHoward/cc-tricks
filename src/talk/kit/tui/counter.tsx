import "#/talk/tokens.css";
import "./tui.css";
import type { Frame } from "#/engine/types";

import {
  drumSlots,
  formatTokens,
  frameSpeed,
  resolveCount,
  tokenScale,
  type CountSource,
} from "./tui-math";
import { setStyle, setText, useFrameRef } from "./use-frame-ref";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const;

export type CounterProps = {
  /** Token count over τ: a constant, keyframes (absolute τ) or a function of τ */
  value: CountSource;
  /** `tokens` adds k/M units; `int` shows plain digits */
  format?: "tokens" | "int";
  minDigits?: number;
  /** Drum slots rendered (most digits ever shown) */
  slots?: number;
  className?: string;
};

function scaleFor(format: "tokens" | "int", n: number) {
  return format === "tokens"
    ? tokenScale(n)
    : { scaled: Math.max(0, n), decimals: 0, unit: "" as const };
}

function Column({ variant }: { variant?: "a" | "b" }) {
  const cls = variant
    ? `tui-drum-col tui-drum-col--ghost tui-drum-col--ghost-${variant}`
    : "tui-drum-col";
  return (
    <span className={cls} aria-hidden>
      {DIGITS.map((d, i) => (
        // oxlint-disable-next-line react/no-array-index-key -- fixed drum faces; 0 repeats at the wrap
        <span key={i}>{d}</span>
      ))}
    </span>
  );
}

/** Odometer: tabular drums with a detent, speed ghosts and a widening digit count. */
export function Counter({
  value,
  format = "tokens",
  minDigits = 1,
  slots = 7,
  className,
}: CounterProps) {
  const fn = resolveCount(value);
  const ref = useFrameRef<HTMLSpanElement>((root: HTMLSpanElement, frame: Frame) => {
    const n = fn(frame.tau);
    const { scaled, decimals, unit } = scaleFor(format, n);
    const speed = frameSpeed((t) => scaleFor(format, fn(t)).scaled, frame.tau, frame.v);
    const drums = drumSlots(scaled, Math.max(minDigits, decimals + 1), slots, speed);
    const children = root.children;
    for (let k = 0; k < slots; k++) {
      const el = children[slots - 1 - k] as HTMLElement | undefined;
      const slot = drums[k];
      if (!el || !slot) continue;
      setStyle(el, "--pos", slot.pos.toFixed(4));
      setStyle(el, "--blur", slot.blur.toFixed(3));
      setStyle(el, "width", `${slot.width.toFixed(4)}ch`);
    }
    const dot = children[slots] as HTMLElement | undefined;
    if (dot) {
      setStyle(dot, "order", String(2 * (slots - decimals) - 1));
      setStyle(dot, "display", decimals > 0 ? "inline" : "none");
    }
    setText(children[slots + 1], unit);
    root.setAttribute("aria-label", formatTokens(n));
  });
  return (
    <span ref={ref} className={`tui-counter ${className ?? ""}`}>
      {Array.from({ length: slots }, (_, i) => (
        <span key={`slot-${slots - i}`} className="tui-drum" style={{ order: 2 * i }}>
          <Column variant="a" />
          <Column variant="b" />
          <Column />
        </span>
      ))}
      <span aria-hidden>.</span>
      <span aria-hidden style={{ order: 2 * slots + 1 }} />
    </span>
  );
}
