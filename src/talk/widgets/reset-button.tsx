import { useRef, useState } from "react";

import { useFrame, useStage } from "#/engine/stage/react";

import { typedAt } from "./logic";
import { WidgetShell } from "./widget-shell";

const ANSWER = "not during a talk";

/** W7: the banked reset button answers back. */
export function ResetButton() {
  const stage = useStage();
  const [pressedAt, setPressedAt] = useState<number | null>(null);
  const answer = useRef<HTMLSpanElement>(null);

  useFrame((frame) => {
    const el = answer.current;
    if (!el) return;
    const text = pressedAt === null ? "" : typedAt(ANSWER, frame.w - pressedAt);
    if (el.textContent !== text) el.textContent = text;
  });

  return (
    <WidgetShell label="Limit reset">
      <div
        className="wg-card wg-row type-label"
        style={{ justifyContent: "space-between", gap: 40 }}
      >
        <b>Full reset</b>
        <span style={{ color: "var(--muted)" }}>Expires Oct 23</span>
        <button
          type="button"
          className="wg-button wg-button--primary type-label"
          onClick={() => setPressedAt(stage.frame().w)}
        >
          Reset for free
        </button>
      </div>
      <span ref={answer} className="wg-answer type-label" aria-live="polite" />
    </WidgetShell>
  );
}
