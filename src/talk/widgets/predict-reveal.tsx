import { useState } from "react";

import { useStage } from "#/engine/stage/react";
import { LAYA_BARS, LAYA_INPUT } from "#/talk/data/laya";
import { ProbBars } from "#/talk/kit/data/prob-bars";

import { WidgetShell } from "./widget-shell";

const GUESSES = ["billing", "technical"] as const;

/** W6: the room guesses the department, then Laya's typed probabilities spring in. */
export function PredictReveal({ width = 1300 }: { width?: number }) {
  const stage = useStage();
  const [guess, setGuess] = useState<{ pick: string; at: number } | null>(null);

  return (
    <WidgetShell label="Predict, then reveal">
      <div className="type-code">{LAYA_INPUT}</div>
      <div className="wg-row">
        <span className="type-label" style={{ color: "var(--soft)" }}>
          Billing or technical?
        </span>
        {GUESSES.map((g) => (
          <button
            key={g}
            type="button"
            className="wg-chip type-label"
            aria-pressed={guess?.pick === g}
            onClick={() => setGuess({ pick: g, at: stage.frame().w })}
          >
            {g}
          </button>
        ))}
        {guess ? (
          <button type="button" className="wg-button type-label" onClick={() => setGuess(null)}>
            Ask again
          </button>
        ) : null}
      </div>
      {guess ? (
        <ProbBars
          key={guess.at}
          bars={LAYA_BARS}
          start={guess.at}
          stagger={0.2}
          clock="w"
          width={width}
        />
      ) : null}
    </WidgetShell>
  );
}
