import "#/talk/tokens.css";
import type { CSSProperties, ReactNode } from "react";

import "./widgets.css";

const blurInside = (root: HTMLElement) => {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== root && root.contains(active)) active.blur();
};

/** Escape or a finished mouse gesture hands focus (and the arrow keys) back to the stage. */
function releaseFocus(root: HTMLElement | null) {
  if (!root) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") blurInside(root);
  };
  const onPointerUp = () => queueMicrotask(() => blurInside(root));
  root.addEventListener("keydown", onKey);
  root.addEventListener("pointerup", onPointerUp);
  return () => {
    root.removeEventListener("keydown", onKey);
    root.removeEventListener("pointerup", onPointerUp);
  };
}

/** Root for every widget: `data-interactive` keeps stage clicks and nav keys out while focused. */
export function WidgetShell({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      ref={releaseFocus}
      aria-label={label}
      data-interactive
      className={`wg ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (v: number) => void;
}) {
  const fill = `${(((value - min) / (max - min)) * 100).toFixed(1)}%`;
  return (
    <label className="wg-slider type-label">
      <span>{label}</span>
      <input
        className="wg-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={display}
        style={{ "--fill": fill } as CSSProperties}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
      <output>{display}</output>
    </label>
  );
}
